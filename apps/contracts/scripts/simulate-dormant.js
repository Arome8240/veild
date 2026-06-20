/**
 * simulate-dormant.js — Activate accounts that have never interacted on-chain.
 *
 * Queries MongoDB for BATCH_SIZE accounts where interactionCount === 0 (and
 * no successful InteractionLog entry exists), funds them from the master
 * wallet, then drives them through a broad cross-contract simulation covering
 * the full Veild suite: Registry, Messages, Tips, Subscriptions, Pools,
 * Governance, Gifts and Staking.
 *
 * Phases:
 *   1. Query   — find dormant accounts from MongoDB
 *   2. Fund    — top up any below LOW_THRESHOLD from master wallet
 *   3. Register — creators in the batch get registered on VeildRegistry
 *   4. Activate — each fan runs through a probabilistic action menu
 *
 * Usage:
 *   node scripts/simulate-dormant.js
 *   node scripts/simulate-dormant.js --batch 50   # smaller batch
 *   node scripts/simulate-dormant.js --dry-run    # no on-chain txs
 *
 * Required .env:
 *   MONGODB_URI                  mongodb connection string
 *   RPC_URL                      Celo RPC endpoint
 *   MASTER_PRIVATE_KEY           funded wallet for top-ups (must be contract owner)
 *   VEILD_REGISTRY_ADDRESS
 *   VEILD_MESSAGES_ADDRESS
 *   VEILD_TIPS_ADDRESS
 *   VEILD_SUBSCRIPTIONS_ADDRESS
 *   VEILD_POOLS_ADDRESS
 *   VEILD_GOVERNANCE_ADDRESS
 *   VEILD_GIFTS_ADDRESS
 *   VEILD_STAKING_ADDRESS
 *   VEILD_BADGES_ADDRESS         (owner-only: master wallet awards badges)
 *   VEILD_AUCTION_ADDRESS
 *   VEILD_REFERRAL_ADDRESS       (owner-only: master wallet records referrals)
 *   VEILD_FEE_DISTRIBUTOR_ADDRESS
 */

import { ethers }   from 'ethers';
import mongoose     from 'mongoose';
import dotenv       from 'dotenv';
import { Account, InteractionLog } from './models.js';
dotenv.config();

// ─── Config ───────────────────────────────────────────────────────────────────

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/veild_simulation';
const RPC_URL     = process.env.RPC_URL     || 'https://forno.celo.org';

const ADDR = {
  registry:       process.env.VEILD_REGISTRY_ADDRESS,
  messages:       process.env.VEILD_MESSAGES_ADDRESS,
  tips:           process.env.VEILD_TIPS_ADDRESS,
  subscriptions:  process.env.VEILD_SUBSCRIPTIONS_ADDRESS,
  pools:          process.env.VEILD_POOLS_ADDRESS,
  governance:     process.env.VEILD_GOVERNANCE_ADDRESS,
  gifts:          process.env.VEILD_GIFTS_ADDRESS,
  staking:        process.env.VEILD_STAKING_ADDRESS,
  badges:         process.env.VEILD_BADGES_ADDRESS,
  auction:        process.env.VEILD_AUCTION_ADDRESS,
  referral:       process.env.VEILD_REFERRAL_ADDRESS,
  feeDistributor: process.env.VEILD_FEE_DISTRIBUTOR_ADDRESS,
};

// CLI
const args      = process.argv.slice(2);
const DRY_RUN   = args.includes('--dry-run');
const batchArg  = args.indexOf('--batch');
const BATCH_SIZE = batchArg !== -1 ? parseInt(args[batchArg + 1]) : 100;

// Probabilities for optional fan actions
const TIP_CHANCE     = 0.30;
const SUB_CHANCE     = 0.20;
const POOL_CHANCE    = 0.15;
const VOTE_CHANCE    = 0.15;
const GIFT_CHANCE    = 0.10;
const STAKE_CHANCE   = 0.10;
const BID_CHANCE     = 0.20; // fan bids on an active auction
const DIST_CHANCE    = 0.05; // fan triggers FeeDistributor.distribute()

// Probabilities for creator actions
const AUCTION_CHANCE = 0.30; // creator opens an auction slot
const BADGE_CHANCE   = 0.50; // 50% of creators earn VerifiedCreator badge (id 2)

// Values
const TIP_AMOUNT        = ethers.parseEther('0.002');   // above MIN_TIP (0.001)
const POOL_SEED         = ethers.parseEther('0.001');   // above MIN_CONTRIBUTION (0.0005)
const STAKE_AMOUNT      = ethers.parseEther('0.01');
const FUND_AMOUNT       = ethers.parseEther('1.0');
const LOW_THRESHOLD     = ethers.parseEther('0.5');
const PRIORITY_FEE_ETH  = '0.001';
const PRIORITY_CHANCE   = 0.20;
const GAS_BUFFER        = 130n;
const TX_DELAY_MS       = 500;
const POOL_DURATION     = 3n * 24n * 3600n; // 3 days in seconds
const MIN_BID_AMOUNT    = ethers.parseEther('0.005');   // floor bid on auction slots
const AUCTION_MIN_BID   = ethers.parseEther('0.003');   // min bid set by creator
const AUCTION_DURATION  = 3n * 24n * 3600n;             // 3-day auction window

// ─── ABIs ─────────────────────────────────────────────────────────────────────

const REGISTRY_ABI = [
  'function register(string _username, string _name, string _bio, string _avatarCID, string _category) external payable',
  'function isRegistered(address _addr) external view returns (bool)',
  'function totalCreators() external view returns (uint256)',
];

const MESSAGES_ABI = [
  'function sendMessage(address _creator, string _content) external',
  'function sendPriorityMessage(address _creator, string _content) external payable',
  'function replyToMessage(uint256 _index, string _reply, bool _publish) external',
  'function getInbox(address _creator) external view returns (tuple(uint256 id, string content, string reply, bool isPriority, uint256 fee, uint256 sentAt, uint256 repliedAt, bool isAnswered, bool isPublished, bool isArchived)[])',
  'function getWall(address _creator) external view returns (tuple(uint256 id, uint256 messageId, string question, string answer, uint256 likes, uint256 publishedAt)[])',
  'function getEarnings(address _creator) external view returns (uint256)',
  'function priorityFee() external view returns (uint256)',
];

const TIPS_ABI = [
  'function tip(address _creator, string calldata _message) external payable',
  'function getEarnings(address _creator) external view returns (uint256)',
];

const SUBSCRIPTIONS_ABI = [
  'function createTier(uint256 _pricePerMonth, string calldata _label) external',
  'function subscribe(address _creator, uint256 _tierId) external payable',
  'function getTiers(address _creator) external view returns (tuple(uint256 id, uint256 pricePerMonth, string label, bool active)[])',
  'function isSubscribed(address _creator, address _fan) external view returns (bool)',
  'function getEarnings(address _creator) external view returns (uint256)',
];

const POOLS_ABI = [
  'function createPool(address _creator, string calldata _question, uint256 _duration) external payable',
  'function contribute(uint256 _poolId) external payable',
  'function answerPool(uint256 _poolId, string calldata _answer) external',
  'function getPool(uint256 _poolId) external view returns (tuple(uint256 id, address creator, address initiator, string question, string answer, uint256 totalAmount, uint256 deadline, uint8 state))',
  'function getPoolCount() external view returns (uint256)',
  'function getActivePools(address _creator) external view returns (tuple(uint256 id, address creator, address initiator, string question, string answer, uint256 totalAmount, uint256 deadline, uint8 state)[])',
];

const GOVERNANCE_ABI = [
  'function createProposal(string calldata title, string calldata description) external',
  'function castVote(uint256 proposalId, bool support) external',
  'function getProposal(uint256 proposalId) external view returns (tuple(uint256 id, address proposer, string title, string description, uint256 forVotes, uint256 againstVotes, uint256 startTime, uint256 endTime, uint8 state))',
  'function getProposalState(uint256 proposalId) external view returns (uint8)',
  'function proposalCount() external view returns (uint256)',
  'function hasVoted(uint256 proposalId, address voter) external view returns (bool)',
];

const GIFTS_ABI = [
  'function sendGift(address creator, uint256 giftTypeId, string calldata message) external payable',
  'function getGiftType(uint256 id) external view returns (tuple(string name, uint256 price, bool active))',
  'function giftTypeCount() external view returns (uint256)',
];

const STAKING_ABI = [
  'function stake() external payable',
  'function getStake(address creator) external view returns (tuple(uint256 amount, uint256 since, uint256 unlockAt))',
  'function canWithdraw(address creator) external view returns (bool)',
];

const BADGES_ABI = [
  'function awardBadge(address holder, uint256 badgeId) external',
  'function awardBadges(address holder, uint256[] calldata badgeIds) external',
  'function hasBadge(address holder, uint256 badgeId) external view returns (bool)',
  'function getBadges(address holder) external view returns (uint256[] memory)',
];

const AUCTION_ABI = [
  'function createAuction(string calldata label, uint256 minBid, uint256 duration) external returns (uint256)',
  'function placeBid(uint256 auctionId) external payable',
  'function auctionCount() external view returns (uint256)',
  'function getAuction(uint256 auctionId) external view returns (tuple(uint256 id, address creator, string label, uint256 minBid, uint256 highestBid, address highestBidder, uint256 startTime, uint256 endTime, uint8 state, bool claimed))',
  'function isActive(uint256 auctionId) external view returns (bool)',
];

const REFERRAL_ABI = [
  'function recordReferral(address referrer, address referred) external',
  'function claimReward() external',
  'function getStats(address referrer) external view returns (tuple(uint256 totalReferrals, uint256 pendingReward, uint256 claimedReward))',
  'function hasBeenReferred(address) external view returns (bool)',
];

const FEE_DISTRIBUTOR_ABI = [
  'function distribute() external',
];

// ─── Content pools ─────────────────────────────────────────────────────────────

const FIRST_NAMES  = ['Alex','Jordan','Sam','Taylor','Morgan','Casey','Riley','Avery','Quinn','Blake','Drew','Sage','River','Phoenix','Reese'];
const LAST_NAMES   = ['Rivera','Chen','Taylor','Kim','Patel','Lee','Garcia','Martinez','Nguyen','Wilson','Brown','Davis','Moore','Jackson','White'];
const CATEGORIES   = ['Art & Design','Music','Tech & Education','Gaming','Fitness','Comedy','Cooking','Photography','Writing','Fashion'];
const BIOS         = [
  'Creating content and building community one post at a time.',
  'Sharing what I know. Ask me anything.',
  'Full-time creator. Part-time human.',
  'Your questions keep me going. Drop one below.',
  'Making things on the internet since forever.',
];
const FAN_MESSAGES = [
  'What inspired you to start creating?',
  'How do you stay consistent?',
  'Any advice for beginners?',
  'What was your biggest breakthrough?',
  'How do you handle creative blocks?',
  'What tools do you use every day?',
  'Do you plan to collab soon?',
  'What does your daily routine look like?',
  'How long did it take to find your niche?',
  "Is it worth pursuing full time?",
  'What would you tell your past self?',
  'Which project are you most proud of?',
  'How do you deal with criticism online?',
  "What's next for you?",
  'Any resources you would recommend?',
];
const TIP_MESSAGES = [
  'Keep it up!',
  'Love your content.',
  'Thanks for sharing.',
  'Sending support!',
  'This helped me a lot.',
];
const POOL_QUESTIONS = [
  'What would you want a full masterclass on?',
  'Which topic should I cover next?',
  'What question have you always wanted to ask me?',
  'What skill do you most want to learn from me?',
  'What behind-the-scenes content would interest you most?',
];
const PROPOSALS = [
  { title: 'Add creator tipping leaderboard', description: 'Display top tippers on creator profiles to incentivise engagement.' },
  { title: 'Introduce weekly community calls', description: 'Scheduled calls where verified creators share insights with the community.' },
  { title: 'Reduce registration fee by 50%', description: 'Lower the barrier for new creators joining the platform.' },
  { title: 'Add dark-mode toggle', description: 'A user-requested UI improvement to support low-light environments.' },
  { title: 'Implement referral multiplier', description: 'Increase referral rewards for users who onboard three or more creators.' },
];
const SUB_TIER_LABELS = ['Bronze', 'Silver', 'Gold', 'Supporter', 'VIP'];
const AUCTION_LABELS  = [
  'Exclusive 30-min Q&A session',
  'Personal feedback on your creative work',
  'Behind-the-scenes tutorial walkthrough',
  'Priority question answered on stream',
  'One-on-one mentorship session',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const rand      = (arr)     => arr[Math.floor(Math.random() * arr.length)];
const coinFlip  = (p)       => Math.random() < p;
const delay     = (ms)      => new Promise(r => setTimeout(r, ms));
const fmt       = (wei)     => ethers.formatEther(wei);
const shortAddr = (addr)    => `${addr.slice(0, 6)}…${addr.slice(-4)}`;
const log       = (pfx, msg) => console.log(`${pfx} ${msg}`);

async function gas(fn, ...args) {
  const est = await fn.estimateGas(...args);
  return est * GAS_BUFFER / 100n;
}

async function ensureFunded(wallet, provider, masterWallet, label) {
  const balance = await provider.getBalance(wallet.address);
  if (balance >= LOW_THRESHOLD || DRY_RUN) return balance;

  log('  💸', `${label} balance ${fmt(balance)} CELO — topping up…`);
  try {
    const tx = await masterWallet.sendTransaction({
      to: wallet.address,
      value: FUND_AMOUNT,
      gasLimit: 21_000n,
    });
    await tx.wait();
    await InteractionLog.create({
      accountAddress: masterWallet.address,
      toAddress:      wallet.address,
      actionType:     'fund',
      status:         'success',
      meta:           { amount: fmt(FUND_AMOUNT) },
    });
    log('  ✅', `Funded ${fmt(FUND_AMOUNT)} CELO → ${label}`);
    return provider.getBalance(wallet.address);
  } catch (err) {
    log('  ❌', `Fund failed: ${err.shortMessage ?? err.message}`);
    return balance;
  }
}

async function preflight(contract, fn, ...args) {
  try {
    await contract[fn].staticCall(...args);
    return true;
  } catch (err) {
    return err.errorName ?? err.reason ?? err.shortMessage ?? err.message;
  }
}

// ─── Phase 1: Query dormant accounts ──────────────────────────────────────────

async function findDormantAccounts() {
  // Addresses that already have at least one successful on-chain interaction
  const activeAddrs = await InteractionLog.distinct('accountAddress', {
    status:     'success',
    actionType: { $ne: 'fund' },
  });

  const accounts = await Account.find({
    interactionCount: 0,
    address: { $nin: activeAddrs },
  }).limit(BATCH_SIZE);

  log('🔍', `Found ${accounts.length} dormant accounts (interactionCount=0, no successful log)`);
  return accounts;
}

// ─── Phase 2: Fund all dormant accounts ───────────────────────────────────────

async function fundBatch(accounts, provider, masterWallet) {
  log('\n💳', `Checking funding for ${accounts.length} accounts…`);
  for (let i = 0; i < accounts.length; i++) {
    const wallet = new ethers.Wallet(accounts[i].privateKey, provider);
    await ensureFunded(wallet, provider, masterWallet, shortAddr(accounts[i].address));
    await delay(200);
  }
}

// ─── Phase 3: Register creators ───────────────────────────────────────────────

async function registerCreators(creators, provider, masterWallet) {
  if (!ADDR.registry) {
    log('⚠️ ', 'VEILD_REGISTRY_ADDRESS not set — skipping registration.');
    return;
  }

  const toRegister = creators.filter(c => !c.isRegistered);
  if (toRegister.length === 0) {
    log('✅', 'All creators in batch already registered.');
    return;
  }

  log('\n📋', `Registering ${toRegister.length} creators…`);

  for (let i = 0; i < toRegister.length; i++) {
    const acct   = toRegister[i];
    const label  = `[${i + 1}/${toRegister.length}] ${shortAddr(acct.address)}`;
    const wallet = new ethers.Wallet(acct.privateKey, provider);

    if (!acct.username) {
      log(label, '⚠️  No username — skipping.');
      continue;
    }

    const name      = `${rand(FIRST_NAMES)} ${rand(LAST_NAMES)}`;
    const bio       = rand(BIOS);
    const avatarCID = `https://api.dicebear.com/7.x/avataaars/svg?seed=${acct.username}`;
    const category  = rand(CATEGORIES);
    const registry  = new ethers.Contract(ADDR.registry, REGISTRY_ABI, wallet);

    try {
      if (!DRY_RUN) {
        const onChain = await registry.isRegistered(acct.address);
        if (onChain) {
          await Account.updateOne({ address: acct.address }, { isRegistered: true });
          log(label, 'Already registered on-chain — synced DB.');
          continue;
        }

        const check = await preflight(registry, 'register', acct.username, name, bio, avatarCID, category);
        if (check !== true) {
          log(label, `⛔ preflight: ${check} — skipping`);
          await logAction(acct.address, null, 'register', 'failed', null, `preflight: ${check}`, { username: acct.username });
          continue;
        }

        const gl  = await gas(registry.register, acct.username, name, bio, avatarCID, category);
        const tx  = await registry.register(acct.username, name, bio, avatarCID, category, { gasLimit: gl });
        const rec = await tx.wait();

        if (rec.status === 1) {
          await Account.updateOne({ address: acct.address }, { isRegistered: true });
          await logAction(acct.address, rec.hash, 'register', 'success', rec.gasUsed?.toString(), null, { username: acct.username });
          log(label, `✅ Registered @${acct.username}`);

          // Record a referral from a random existing registered creator (owner-only)
          if (ADDR.referral) {
            try {
              const referralContract = new ethers.Contract(ADDR.referral, REFERRAL_ABI, masterWallet);
              const alreadyReferred  = await referralContract.hasBeenReferred(acct.address);
              if (!alreadyReferred) {
                const referrer = await Account.findOne({
                  role:         'creator',
                  isRegistered: true,
                  address:      { $ne: acct.address },
                });
                if (referrer) {
                  const check = await preflight(referralContract, 'recordReferral', referrer.address, acct.address);
                  if (check === true) {
                    const gl  = await gas(referralContract.recordReferral, referrer.address, acct.address);
                    const rtx = await referralContract.recordReferral(referrer.address, acct.address, { gasLimit: gl });
                    const rrec = await rtx.wait();
                    await logAction(masterWallet.address, rrec.hash, 'recordReferral', rrec.status === 1 ? 'success' : 'failed', rrec.gasUsed?.toString(), null, { referrer: referrer.address, referred: acct.address });
                    log(label, `🔗 referral recorded from @${referrer.username ?? shortAddr(referrer.address)}`);
                  }
                }
              }
            } catch (err) {
              log(label, `⚠️  recordReferral: ${err.shortMessage ?? err.message}`);
            }
            await delay(TX_DELAY_MS);
          }
        } else {
          throw new Error('tx reverted');
        }
      } else {
        log(label, `[dry-run] Would register @${acct.username}`);
      }
    } catch (err) {
      const reason = err.errorName ?? err.reason ?? err.shortMessage ?? err.message;
      log(label, `❌ ${reason}`);
      await logAction(acct.address, null, 'register', 'failed', null, reason, { username: acct.username });
    }

    await delay(TX_DELAY_MS);
  }
}

// ─── Phase 4: Activate fans ────────────────────────────────────────────────────

/**
 * Pre-fetch shared on-chain state so we don't call RPC inside every account loop.
 */
async function fetchSharedState(provider) {
  const state = {
    registeredCreators: [],
    activePools:        [],
    activeProposals:    [],
    giftTypeCount:      0n,
    activeAuctions:     [],
  };

  state.registeredCreators = await Account.find({ role: 'creator', isRegistered: true }).lean();
  log('📊', `${state.registeredCreators.length} registered creators in DB`);

  if (ADDR.pools) {
    try {
      const pools    = new ethers.Contract(ADDR.pools, POOLS_ABI, provider);
      const count    = await pools.getPoolCount();
      const poolList = [];
      // Scan up to 50 most recent pools looking for active ones (state === 0 = Active)
      const start = count > 50n ? count - 50n : 0n;
      for (let id = start; id < count; id++) {
        try {
          const p = await pools.getPool(id);
          if (Number(p.state) === 0) poolList.push({ id, address: p.creator });
        } catch { /* skip invalid id */ }
      }
      state.activePools = poolList;
      log('📊', `${poolList.length} active pools found`);
    } catch (err) {
      log('⚠️ ', `Could not fetch pools: ${err.shortMessage ?? err.message}`);
    }
  }

  if (ADDR.governance) {
    try {
      const gov   = new ethers.Contract(ADDR.governance, GOVERNANCE_ABI, provider);
      const count = await gov.proposalCount();
      const open  = [];
      // Check up to 20 most recent proposals for "Active" state (1)
      const start = count > 20n ? count - 20n : 0n;
      for (let id = start; id < count; id++) {
        try {
          const s = await gov.getProposalState(id);
          if (Number(s) === 1) open.push(id); // 1 = Active
        } catch { /* skip */ }
      }
      state.activeProposals = open;
      log('📊', `${open.length} active governance proposals`);
    } catch (err) {
      log('⚠️ ', `Could not fetch proposals: ${err.shortMessage ?? err.message}`);
    }
  }

  if (ADDR.gifts) {
    try {
      const gifts = new ethers.Contract(ADDR.gifts, GIFTS_ABI, provider);
      state.giftTypeCount = await gifts.giftTypeCount();
      log('📊', `${state.giftTypeCount} gift types available`);
    } catch (err) {
      log('⚠️ ', `Could not fetch gift types: ${err.shortMessage ?? err.message}`);
    }
  }

  if (ADDR.auction) {
    try {
      const auctionContract = new ethers.Contract(ADDR.auction, AUCTION_ABI, provider);
      const count = await auctionContract.auctionCount();
      const activeAuctions = [];
      const start = count > 20n ? count - 20n : 1n;
      for (let id = start; id <= count; id++) {
        try {
          const active = await auctionContract.isActive(id);
          if (active) {
            const a = await auctionContract.getAuction(id);
            activeAuctions.push({ id, minBid: a.minBid, highestBid: a.highestBid });
          }
        } catch { /* skip invalid id */ }
      }
      state.activeAuctions = activeAuctions;
      log('📊', `${activeAuctions.length} active auctions found`);
    } catch (err) {
      log('⚠️ ', `Could not fetch auctions: ${err.shortMessage ?? err.message}`);
    }
  }

  return state;
}

async function logAction(accountAddress, txHash, actionType, status, gasUsed, errorMsg, meta) {
  await InteractionLog.create({
    accountAddress,
    txHash:   txHash   ?? null,
    actionType,
    status,
    gasUsed:  gasUsed  ?? null,
    errorMsg: errorMsg ?? null,
    meta:     meta     ?? null,
  });
}

async function activateFan(acct, state, provider, masterWallet, index, total) {
  const label  = `[${index}/${total}] fan ${shortAddr(acct.address)}`;
  const wallet = new ethers.Wallet(acct.privateKey, provider);
  const bal    = await ensureFunded(wallet, provider, masterWallet, label);

  if (bal < LOW_THRESHOLD && !DRY_RUN) {
    log(label, '⚠️  Still underfunded — skipping.');
    return;
  }

  const { registeredCreators, activePools, activeProposals, giftTypeCount, activeAuctions } = state;

  if (registeredCreators.length === 0) {
    log(label, '⚠️  No registered creators yet — skipping fan actions.');
    return;
  }

  const target = rand(registeredCreators);
  let actionsCompleted = 0;

  // ── 1. Send a message (always) ────────────────────────────────────────────
  if (ADDR.messages) {
    const messages  = new ethers.Contract(ADDR.messages, MESSAGES_ABI, wallet);
    const content   = rand(FAN_MESSAGES);
    const priority  = coinFlip(PRIORITY_CHANCE);
    const action    = priority ? 'sendPriorityMessage' : 'sendMessage';

    try {
      if (!DRY_RUN) {
        let tx;
        if (priority) {
          const fee = ethers.parseEther(PRIORITY_FEE_ETH);
          const gl  = await gas(messages.sendPriorityMessage, target.address, content, { value: fee });
          tx        = await messages.sendPriorityMessage(target.address, content, { value: fee, gasLimit: gl });
        } else {
          const gl  = await gas(messages.sendMessage, target.address, content);
          tx        = await messages.sendMessage(target.address, content, { gasLimit: gl });
        }
        const rec = await tx.wait();
        await logAction(acct.address, rec.hash, action, rec.status === 1 ? 'success' : 'failed', rec.gasUsed?.toString(), null, { content: content.slice(0, 60), creator: target.address });
        log(label, `${priority ? '⚡' : '✉️ '} ${action} → @${target.username ?? shortAddr(target.address)}`);
        actionsCompleted++;
      } else {
        log(label, `[dry-run] ${action} → @${target.username}`);
      }
    } catch (err) {
      const r = err.errorName ?? err.shortMessage ?? err.message;
      log(label, `❌ ${action}: ${r}`);
      await logAction(acct.address, null, action, 'failed', null, r, null);
    }
    await delay(TX_DELAY_MS);
  }

  // ── 2. Tip (30%) ──────────────────────────────────────────────────────────
  if (ADDR.tips && coinFlip(TIP_CHANCE)) {
    const tips   = new ethers.Contract(ADDR.tips, TIPS_ABI, wallet);
    const tipMsg = rand(TIP_MESSAGES);
    const tipTarget = rand(registeredCreators);

    try {
      if (!DRY_RUN) {
        const check = await preflight(tips, 'tip', tipTarget.address, tipMsg, { value: TIP_AMOUNT });
        if (check !== true) {
          log(label, `⛔ tip preflight: ${check}`);
        } else {
          const gl  = await gas(tips.tip, tipTarget.address, tipMsg, { value: TIP_AMOUNT });
          const tx  = await tips.tip(tipTarget.address, tipMsg, { value: TIP_AMOUNT, gasLimit: gl });
          const rec = await tx.wait();
          await logAction(acct.address, rec.hash, 'tip', rec.status === 1 ? 'success' : 'failed', rec.gasUsed?.toString(), null, { amount: fmt(TIP_AMOUNT), creator: tipTarget.address });
          log(label, `💸 tipped ${fmt(TIP_AMOUNT)} CELO → @${tipTarget.username ?? shortAddr(tipTarget.address)}`);
          actionsCompleted++;
          // Award FirstTip badge (id 3) to the creator receiving their first tip
          if (ADDR.badges && rec.status === 1) {
            try {
              const badges = new ethers.Contract(ADDR.badges, BADGES_ABI, masterWallet);
              const hasIt  = await badges.hasBadge(tipTarget.address, 3n);
              if (!hasIt) {
                const gl  = await gas(badges.awardBadge, tipTarget.address, 3n);
                const btx = await badges.awardBadge(tipTarget.address, 3n, { gasLimit: gl });
                const brec = await btx.wait();
                await logAction(masterWallet.address, brec.hash, 'awardBadge', brec.status === 1 ? 'success' : 'failed', brec.gasUsed?.toString(), null, { holder: tipTarget.address, badgeId: '3' });
                log(label, `🏅 awarded FirstTip badge to @${tipTarget.username ?? shortAddr(tipTarget.address)}`);
              }
            } catch (err) {
              log(label, `⚠️  awardBadge(FirstTip): ${err.shortMessage ?? err.message}`);
            }
          }
        }
      } else {
        log(label, `[dry-run] tip → @${tipTarget.username}`);
      }
    } catch (err) {
      const r = err.errorName ?? err.shortMessage ?? err.message;
      log(label, `❌ tip: ${r}`);
      await logAction(acct.address, null, 'tip', 'failed', null, r, null);
    }
    await delay(TX_DELAY_MS);
  }

  // ── 3. Subscribe (20%) ────────────────────────────────────────────────────
  if (ADDR.subscriptions && coinFlip(SUB_CHANCE)) {
    const subs   = new ethers.Contract(ADDR.subscriptions, SUBSCRIPTIONS_ABI, wallet);
    const subTarget = rand(registeredCreators);

    try {
      if (!DRY_RUN) {
        const tiers = await subs.getTiers(subTarget.address);
        const activeTiers = tiers.filter(t => t.active);

        if (activeTiers.length === 0) {
          log(label, `ℹ️  @${subTarget.username ?? shortAddr(subTarget.address)} has no subscription tiers — skipping subscribe`);
        } else {
          const tier    = rand(activeTiers);
          const already = await subs.isSubscribed(subTarget.address, acct.address);
          if (already) {
            log(label, `ℹ️  Already subscribed to @${subTarget.username ?? shortAddr(subTarget.address)}`);
          } else {
            const check = await preflight(subs, 'subscribe', subTarget.address, tier.id, { value: tier.pricePerMonth });
            if (check !== true) {
              log(label, `⛔ subscribe preflight: ${check}`);
            } else {
              const gl  = await gas(subs.subscribe, subTarget.address, tier.id, { value: tier.pricePerMonth });
              const tx  = await subs.subscribe(subTarget.address, tier.id, { value: tier.pricePerMonth, gasLimit: gl });
              const rec = await tx.wait();
              await logAction(acct.address, rec.hash, 'subscribe', rec.status === 1 ? 'success' : 'failed', rec.gasUsed?.toString(), null, { tier: tier.id.toString(), creator: subTarget.address });
              log(label, `🔔 subscribed to @${subTarget.username ?? shortAddr(subTarget.address)} (tier ${tier.id})`);
              actionsCompleted++;
              // Award Subscriber badge (id 5) to the fan
              if (ADDR.badges && rec.status === 1) {
                try {
                  const badges = new ethers.Contract(ADDR.badges, BADGES_ABI, masterWallet);
                  const hasIt  = await badges.hasBadge(acct.address, 5n);
                  if (!hasIt) {
                    const gl  = await gas(badges.awardBadge, acct.address, 5n);
                    const btx = await badges.awardBadge(acct.address, 5n, { gasLimit: gl });
                    const brec = await btx.wait();
                    await logAction(masterWallet.address, brec.hash, 'awardBadge', brec.status === 1 ? 'success' : 'failed', brec.gasUsed?.toString(), null, { holder: acct.address, badgeId: '5' });
                    log(label, `🏅 awarded Subscriber badge to fan`);
                  }
                } catch (err) {
                  log(label, `⚠️  awardBadge(Subscriber): ${err.shortMessage ?? err.message}`);
                }
              }
            }
          }
        }
      } else {
        log(label, `[dry-run] subscribe → @${subTarget.username}`);
      }
    } catch (err) {
      const r = err.errorName ?? err.shortMessage ?? err.message;
      log(label, `❌ subscribe: ${r}`);
      await logAction(acct.address, null, 'subscribe', 'failed', null, r, null);
    }
    await delay(TX_DELAY_MS);
  }

  // ── 4. Pool — contribute to existing or create new (15%) ─────────────────
  if (ADDR.pools && coinFlip(POOL_CHANCE)) {
    const pools = new ethers.Contract(ADDR.pools, POOLS_ABI, wallet);

    if (activePools.length > 0) {
      // Contribute to a random active pool
      const p = rand(activePools);
      try {
        if (!DRY_RUN) {
          const gl  = await gas(pools.contribute, p.id, { value: POOL_SEED });
          const tx  = await pools.contribute(p.id, { value: POOL_SEED, gasLimit: gl });
          const rec = await tx.wait();
          await logAction(acct.address, rec.hash, 'contribute', rec.status === 1 ? 'success' : 'failed', rec.gasUsed?.toString(), null, { poolId: p.id.toString(), amount: fmt(POOL_SEED) });
          log(label, `🌊 contributed ${fmt(POOL_SEED)} CELO to pool #${p.id}`);
          actionsCompleted++;
        } else {
          log(label, `[dry-run] contribute to pool #${p.id}`);
        }
      } catch (err) {
        const r = err.errorName ?? err.shortMessage ?? err.message;
        log(label, `❌ contribute: ${r}`);
        await logAction(acct.address, null, 'contribute', 'failed', null, r, null);
      }
    } else if (registeredCreators.length > 0) {
      // No active pools — create one
      const poolTarget  = rand(registeredCreators);
      const question    = rand(POOL_QUESTIONS);
      try {
        if (!DRY_RUN) {
          const check = await preflight(pools, 'createPool', poolTarget.address, question, POOL_DURATION, { value: POOL_SEED });
          if (check !== true) {
            log(label, `⛔ createPool preflight: ${check}`);
          } else {
            const gl  = await gas(pools.createPool, poolTarget.address, question, POOL_DURATION, { value: POOL_SEED });
            const tx  = await pools.createPool(poolTarget.address, question, POOL_DURATION, { value: POOL_SEED, gasLimit: gl });
            const rec = await tx.wait();
            await logAction(acct.address, rec.hash, 'createPool', rec.status === 1 ? 'success' : 'failed', rec.gasUsed?.toString(), null, { question: question.slice(0, 60), creator: poolTarget.address });
            log(label, `🌊 created pool for @${poolTarget.username ?? shortAddr(poolTarget.address)}`);
            actionsCompleted++;
            // Award PoolCreator badge (id 6) to the creator whose pool was funded
            if (ADDR.badges && rec.status === 1) {
              try {
                const badges = new ethers.Contract(ADDR.badges, BADGES_ABI, masterWallet);
                const hasIt  = await badges.hasBadge(poolTarget.address, 6n);
                if (!hasIt) {
                  const gl  = await gas(badges.awardBadge, poolTarget.address, 6n);
                  const btx = await badges.awardBadge(poolTarget.address, 6n, { gasLimit: gl });
                  const brec = await btx.wait();
                  await logAction(masterWallet.address, brec.hash, 'awardBadge', brec.status === 1 ? 'success' : 'failed', brec.gasUsed?.toString(), null, { holder: poolTarget.address, badgeId: '6' });
                  log(label, `🏅 awarded PoolCreator badge to @${poolTarget.username ?? shortAddr(poolTarget.address)}`);
                }
              } catch (err) {
                log(label, `⚠️  awardBadge(PoolCreator): ${err.shortMessage ?? err.message}`);
              }
            }
          }
        } else {
          log(label, `[dry-run] createPool for @${poolTarget.username}`);
        }
      } catch (err) {
        const r = err.errorName ?? err.shortMessage ?? err.message;
        log(label, `❌ createPool: ${r}`);
        await logAction(acct.address, null, 'createPool', 'failed', null, r, null);
      }
    }
    await delay(TX_DELAY_MS);
  }

  // ── 5. Cast governance vote (15%) ─────────────────────────────────────────
  if (ADDR.governance && coinFlip(VOTE_CHANCE) && activeProposals.length > 0) {
    const gov        = new ethers.Contract(ADDR.governance, GOVERNANCE_ABI, wallet);
    const proposalId = rand(activeProposals);
    const support    = coinFlip(0.6); // 60% vote for

    try {
      if (!DRY_RUN) {
        const alreadyVoted = await gov.hasVoted(proposalId, acct.address);
        if (alreadyVoted) {
          log(label, `ℹ️  Already voted on proposal #${proposalId}`);
        } else {
          const gl  = await gas(gov.castVote, proposalId, support);
          const tx  = await gov.castVote(proposalId, support, { gasLimit: gl });
          const rec = await tx.wait();
          await logAction(acct.address, rec.hash, 'castVote', rec.status === 1 ? 'success' : 'failed', rec.gasUsed?.toString(), null, { proposalId: proposalId.toString(), support });
          log(label, `🗳️  voted ${support ? 'FOR' : 'AGAINST'} proposal #${proposalId}`);
          actionsCompleted++;
        }
      } else {
        log(label, `[dry-run] castVote on proposal #${proposalId}`);
      }
    } catch (err) {
      const r = err.errorName ?? err.shortMessage ?? err.message;
      log(label, `❌ castVote: ${r}`);
      await logAction(acct.address, null, 'castVote', 'failed', null, r, null);
    }
    await delay(TX_DELAY_MS);
  }

  // ── 6. Send a gift (10%) ──────────────────────────────────────────────────
  if (ADDR.gifts && coinFlip(GIFT_CHANCE) && giftTypeCount > 0n) {
    const gifts      = new ethers.Contract(ADDR.gifts, GIFTS_ABI, wallet);
    const giftTarget = rand(registeredCreators);
    // Pick a random valid giftTypeId (1-indexed)
    const giftTypeId = BigInt(Math.floor(Math.random() * Number(giftTypeCount)) + 1);

    try {
      if (!DRY_RUN) {
        const giftType = await gifts.getGiftType(giftTypeId);
        if (!giftType.active) {
          log(label, `ℹ️  Gift type ${giftTypeId} not active — skipping`);
        } else {
          const check = await preflight(gifts, 'sendGift', giftTarget.address, giftTypeId, 'Enjoy!', { value: giftType.price });
          if (check !== true) {
            log(label, `⛔ sendGift preflight: ${check}`);
          } else {
            const gl  = await gas(gifts.sendGift, giftTarget.address, giftTypeId, 'Enjoy!', { value: giftType.price });
            const tx  = await gifts.sendGift(giftTarget.address, giftTypeId, 'Enjoy!', { value: giftType.price, gasLimit: gl });
            const rec = await tx.wait();
            await logAction(acct.address, rec.hash, 'sendGift', rec.status === 1 ? 'success' : 'failed', rec.gasUsed?.toString(), null, { giftTypeId: giftTypeId.toString(), creator: giftTarget.address });
            log(label, `🎁 sent gift #${giftTypeId} to @${giftTarget.username ?? shortAddr(giftTarget.address)}`);
            actionsCompleted++;
          }
        }
      } else {
        log(label, `[dry-run] sendGift → @${giftTarget.username}`);
      }
    } catch (err) {
      const r = err.errorName ?? err.shortMessage ?? err.message;
      log(label, `❌ sendGift: ${r}`);
      await logAction(acct.address, null, 'sendGift', 'failed', null, r, null);
    }
    await delay(TX_DELAY_MS);
  }

  // ── 7. Stake (10%) ────────────────────────────────────────────────────────
  if (ADDR.staking && coinFlip(STAKE_CHANCE)) {
    const staking = new ethers.Contract(ADDR.staking, STAKING_ABI, wallet);

    try {
      if (!DRY_RUN) {
        const gl  = await gas(staking.stake, { value: STAKE_AMOUNT });
        const tx  = await staking.stake({ value: STAKE_AMOUNT, gasLimit: gl });
        const rec = await tx.wait();
        await logAction(acct.address, rec.hash, 'stake', rec.status === 1 ? 'success' : 'failed', rec.gasUsed?.toString(), null, { amount: fmt(STAKE_AMOUNT) });
        log(label, `🔒 staked ${fmt(STAKE_AMOUNT)} CELO`);
        actionsCompleted++;
      } else {
        log(label, `[dry-run] stake ${fmt(STAKE_AMOUNT)} CELO`);
      }
    } catch (err) {
      const r = err.errorName ?? err.shortMessage ?? err.message;
      log(label, `❌ stake: ${r}`);
      await logAction(acct.address, null, 'stake', 'failed', null, r, null);
    }
    await delay(TX_DELAY_MS);
  }

  // ── 8. Bid on an active auction (20%) ─────────────────────────────────────
  if (ADDR.auction && coinFlip(BID_CHANCE) && activeAuctions.length > 0) {
    const auctionContract = new ethers.Contract(ADDR.auction, AUCTION_ABI, wallet);
    const a = rand(activeAuctions);
    // Bid 5 % above current highest, or use MIN_BID_AMOUNT as floor
    const required = a.highestBid > 0n
      ? a.highestBid + (a.highestBid * 500n) / 10_000n
      : a.minBid;
    const bidAmount = required > MIN_BID_AMOUNT ? required : MIN_BID_AMOUNT;

    try {
      if (!DRY_RUN) {
        const check = await preflight(auctionContract, 'placeBid', a.id, { value: bidAmount });
        if (check !== true) {
          log(label, `⛔ placeBid preflight: ${check}`);
        } else {
          const gl  = await gas(auctionContract.placeBid, a.id, { value: bidAmount });
          const tx  = await auctionContract.placeBid(a.id, { value: bidAmount, gasLimit: gl });
          const rec = await tx.wait();
          await logAction(acct.address, rec.hash, 'placeBid', rec.status === 1 ? 'success' : 'failed', rec.gasUsed?.toString(), null, { auctionId: a.id.toString(), amount: fmt(bidAmount) });
          log(label, `🔨 placed bid of ${fmt(bidAmount)} CELO on auction #${a.id}`);
          actionsCompleted++;
        }
      } else {
        log(label, `[dry-run] placeBid on auction #${a.id}`);
      }
    } catch (err) {
      const r = err.errorName ?? err.shortMessage ?? err.message;
      log(label, `❌ placeBid: ${r}`);
      await logAction(acct.address, null, 'placeBid', 'failed', null, r, null);
    }
    await delay(TX_DELAY_MS);
  }

  // ── 9. Trigger fee distribution (5%) ──────────────────────────────────────
  if (ADDR.feeDistributor && coinFlip(DIST_CHANCE)) {
    const feeDist = new ethers.Contract(ADDR.feeDistributor, FEE_DISTRIBUTOR_ABI, wallet);
    try {
      if (!DRY_RUN) {
        const check = await preflight(feeDist, 'distribute');
        if (check !== true) {
          // NoBalance is expected when there are no fees yet — skip silently
          if (!String(check).includes('NoBalance')) {
            log(label, `⛔ distribute preflight: ${check}`);
          }
        } else {
          const gl  = await gas(feeDist.distribute);
          const tx  = await feeDist.distribute({ gasLimit: gl });
          const rec = await tx.wait();
          await logAction(acct.address, rec.hash, 'distribute', rec.status === 1 ? 'success' : 'failed', rec.gasUsed?.toString(), null, null);
          log(label, `💸 triggered fee distribution`);
          actionsCompleted++;
        }
      } else {
        log(label, `[dry-run] distribute fees`);
      }
    } catch (err) {
      const r = err.errorName ?? err.shortMessage ?? err.message;
      if (!r.includes('NoBalance')) {
        log(label, `❌ distribute: ${r}`);
        await logAction(acct.address, null, 'distribute', 'failed', null, r, null);
      }
    }
    await delay(TX_DELAY_MS);
  }

  // ── Mark account as interacted ────────────────────────────────────────────
  if (actionsCompleted > 0) {
    await Account.updateOne(
      { address: acct.address },
      { $inc: { interactionCount: actionsCompleted }, lastInteraction: new Date() },
    );
  }
}

// ─── Phase 4b: Creator actions post-registration ──────────────────────────────

async function activateCreator(acct, provider, masterWallet, index, total) {
  if (!ADDR.messages) return;

  const label  = `[${index}/${total}] creator @${acct.username ?? shortAddr(acct.address)}`;
  const wallet = new ethers.Wallet(acct.privateKey, provider);

  // Try to create a subscription tier if none exists
  if (ADDR.subscriptions) {
    const subs = new ethers.Contract(ADDR.subscriptions, SUBSCRIPTIONS_ABI, wallet);
    try {
      if (!DRY_RUN) {
        const tiers = await subs.getTiers(acct.address);
        if (tiers.length === 0) {
          const price = ethers.parseEther('0.01'); // 0.01 CELO/month
          const label_ = rand(SUB_TIER_LABELS);
          const check = await preflight(subs, 'createTier', price, label_);
          if (check === true) {
            const gl  = await gas(subs.createTier, price, label_);
            const tx  = await subs.createTier(price, label_, { gasLimit: gl });
            const rec = await tx.wait();
            await logAction(acct.address, rec.hash, 'register', rec.status === 1 ? 'success' : 'failed', rec.gasUsed?.toString(), null, { tierAction: 'createTier', price: fmt(price), label: label_ });
            log(label, `🎟️  created ${label_} tier at ${fmt(price)} CELO/month`);
          }
        }
      } else {
        log(label, `[dry-run] createTier`);
      }
    } catch (err) {
      log(label, `⚠️  createTier: ${err.shortMessage ?? err.message}`);
    }
    await delay(TX_DELAY_MS);
  }

  // Reply to any inbox messages
  const messages = new ethers.Contract(ADDR.messages, MESSAGES_ABI, wallet);
  try {
    if (!DRY_RUN) {
      const inbox      = await messages.getInbox(acct.address);
      const unanswered = inbox.map((m, i) => ({ ...m, _index: i })).filter(m => !m.isAnswered && !m.isArchived);

      for (const msg of unanswered) {
        if (!coinFlip(0.6)) continue;
        const reply   = `Thanks for reaching out! ${rand(['Great question.', 'Appreciate it!', 'Will think about this.'])}`;
        const publish = coinFlip(0.5);
        try {
          const gl  = await gas(messages.replyToMessage, BigInt(msg._index), reply, publish);
          const tx  = await messages.replyToMessage(BigInt(msg._index), reply, publish, { gasLimit: gl });
          const rec = await tx.wait();
          await logAction(acct.address, rec.hash, 'replyToMessage', rec.status === 1 ? 'success' : 'failed', rec.gasUsed?.toString(), null, { msgIndex: msg._index, published: publish });
          log(label, `💬 replied to msg #${msg._index}${publish ? ' (published)' : ''}`);
        } catch (err) {
          log(label, `❌ reply #${msg._index}: ${err.shortMessage ?? err.message}`);
        }
        await delay(TX_DELAY_MS);
      }
    } else {
      log(label, `[dry-run] Would check inbox and reply`);
    }
  } catch (err) {
    log(label, `❌ getInbox: ${err.shortMessage ?? err.message}`);
  }

  // ── Open an auction slot (30%) ────────────────────────────────────────────────
  if (ADDR.auction && coinFlip(AUCTION_CHANCE)) {
    const auctionContract = new ethers.Contract(ADDR.auction, AUCTION_ABI, wallet);
    const aLabel = rand(AUCTION_LABELS);
    try {
      if (!DRY_RUN) {
        const check = await preflight(auctionContract, 'createAuction', aLabel, AUCTION_MIN_BID, AUCTION_DURATION);
        if (check === true) {
          const gl  = await gas(auctionContract.createAuction, aLabel, AUCTION_MIN_BID, AUCTION_DURATION);
          const tx  = await auctionContract.createAuction(aLabel, AUCTION_MIN_BID, AUCTION_DURATION, { gasLimit: gl });
          const rec = await tx.wait();
          await logAction(acct.address, rec.hash, 'createAuction', rec.status === 1 ? 'success' : 'failed', rec.gasUsed?.toString(), null, { label: aLabel });
          log(label, `🔨 created auction: "${aLabel}"`);
        } else {
          log(label, `⛔ createAuction preflight: ${check}`);
        }
      } else {
        log(label, `[dry-run] createAuction: "${aLabel}"`);
      }
    } catch (err) {
      log(label, `⚠️  createAuction: ${err.shortMessage ?? err.message}`);
    }
    await delay(TX_DELAY_MS);
  }

  // ── Award badges via master wallet (owner-only) ───────────────────────────────
  if (ADDR.badges) {
    const badges = new ethers.Contract(ADDR.badges, BADGES_ABI, masterWallet);
    try {
      if (!DRY_RUN) {
        const existing = await badges.getBadges(acct.address);
        const owned    = new Set(existing.map(b => Number(b)));
        const toAward  = [];
        // Badge 0 — First Message: all active registered creators qualify
        if (!owned.has(0)) toAward.push(0n);
        // Badge 2 — Verified Creator: awarded to ~50% of creators
        if (!owned.has(2) && coinFlip(BADGE_CHANCE)) toAward.push(2n);

        if (toAward.length > 0) {
          const gl  = await gas(badges.awardBadges, acct.address, toAward);
          const tx  = await badges.awardBadges(acct.address, toAward, { gasLimit: gl });
          const rec = await tx.wait();
          await logAction(masterWallet.address, rec.hash, 'awardBadges', rec.status === 1 ? 'success' : 'failed', rec.gasUsed?.toString(), null, { holder: acct.address, badges: toAward.map(b => b.toString()) });
          log(label, `🏅 awarded badge(s) [${toAward.join(', ')}]`);
        }
      } else {
        log(label, `[dry-run] awardBadges`);
      }
    } catch (err) {
      log(label, `⚠️  awardBadges: ${err.shortMessage ?? err.message}`);
    }
    await delay(TX_DELAY_MS);
  }

  // ── Claim pending referral reward ─────────────────────────────────────────────
  if (ADDR.referral) {
    const referral = new ethers.Contract(ADDR.referral, REFERRAL_ABI, wallet);
    try {
      if (!DRY_RUN) {
        const stats = await referral.getStats(acct.address);
        if (stats.pendingReward > 0n) {
          const check = await preflight(referral, 'claimReward');
          if (check === true) {
            const gl  = await gas(referral.claimReward);
            const tx  = await referral.claimReward({ gasLimit: gl });
            const rec = await tx.wait();
            await logAction(acct.address, rec.hash, 'claimReward', rec.status === 1 ? 'success' : 'failed', rec.gasUsed?.toString(), null, { amount: fmt(stats.pendingReward) });
            log(label, `💎 claimed ${fmt(stats.pendingReward)} CELO referral reward`);
          } else {
            log(label, `⛔ claimReward preflight: ${check}`);
          }
        }
      } else {
        log(label, `[dry-run] claimReward`);
      }
    } catch (err) {
      log(label, `⚠️  claimReward: ${err.shortMessage ?? err.message}`);
    }
    await delay(TX_DELAY_MS);
  }
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  if (!process.env.MASTER_PRIVATE_KEY) {
    console.error('❌  MASTER_PRIVATE_KEY not set.');
    process.exit(1);
  }

  console.log('─'.repeat(72));
  console.log('  🌱  Veild Dormant Account Simulator');
  console.log('─'.repeat(72));
  console.log(`  Batch size : ${BATCH_SIZE}`);
  console.log(`  Network    : ${RPC_URL}`);
  Object.entries(ADDR).forEach(([k, v]) =>
    console.log(`  ${k.padEnd(16)}: ${v ?? '(not set)'}`)
  );
  if (DRY_RUN) console.log('\n  🔍 DRY RUN — no on-chain transactions');
  console.log('─'.repeat(72) + '\n');

  await mongoose.connect(MONGODB_URI);
  console.log('✅  MongoDB connected\n');

  const provider     = new ethers.JsonRpcProvider(RPC_URL);
  const masterWallet = new ethers.Wallet(process.env.MASTER_PRIVATE_KEY, provider);
  const masterBal    = await provider.getBalance(masterWallet.address);

  console.log(`💼  Master  : ${masterWallet.address}`);
  console.log(`💰  Balance : ${fmt(masterBal)} CELO\n`);

  if (masterBal === 0n && !DRY_RUN) {
    console.error('❌  Master wallet has no CELO. Fund it first.');
    process.exit(1);
  }

  // ── Phase 1: Find dormant accounts ────────────────────────────────────────
  console.log('═'.repeat(60));
  console.log('  Phase 1 — Query dormant accounts');
  console.log('═'.repeat(60));
  const dormant = await findDormantAccounts();

  if (dormant.length === 0) {
    console.log('\n✅  No dormant accounts found. All accounts have interacted.');
    await mongoose.disconnect();
    process.exit(0);
  }

  const dormantCreators = dormant.filter(a => a.role === 'creator');
  const dormantFans     = dormant.filter(a => a.role === 'fan');
  console.log(`   Creators : ${dormantCreators.length}`);
  console.log(`   Fans     : ${dormantFans.length}`);

  // ── Phase 2: Fund ─────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  console.log('  Phase 2 — Fund dormant accounts');
  console.log('═'.repeat(60));
  await fundBatch(dormant, provider, masterWallet);

  // ── Phase 3: Register creators ────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  console.log('  Phase 3 — Register creators');
  console.log('═'.repeat(60));
  await registerCreators(dormantCreators, provider, masterWallet);

  // ── Phase 4: Shared state snapshot ────────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  console.log('  Phase 4 — Activate dormant accounts');
  console.log('═'.repeat(60));
  const state = await fetchSharedState(provider);

  // Fans
  for (let i = 0; i < dormantFans.length; i++) {
    await activateFan(dormantFans[i], state, provider, masterWallet, i + 1, dormantFans.length);
  }

  // Creators (post-registration actions)
  const registeredInBatch = dormantCreators.filter(c => c.isRegistered);
  for (let i = 0; i < registeredInBatch.length; i++) {
    await activateCreator(registeredInBatch[i], provider, masterWallet, i + 1, registeredInBatch.length);
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  const [total, success, failed] = await Promise.all([
    InteractionLog.countDocuments(),
    InteractionLog.countDocuments({ status: 'success' }),
    InteractionLog.countDocuments({ status: 'failed' }),
  ]);

  const byAction = await InteractionLog.aggregate([
    { $group: { _id: '$actionType', count: { $sum: 1 } } },
    { $sort:  { count: -1 } },
  ]);

  console.log('\n' + '═'.repeat(60));
  console.log('  SUMMARY');
  console.log('═'.repeat(60));
  console.log(`  Dormant accounts processed : ${dormant.length}`);
  console.log(`  Total interactions logged  : ${total}`);
  console.log(`  Success                    : ${success}`);
  console.log(`  Failed                     : ${failed}`);
  console.log('\n  By action:');
  for (const { _id, count } of byAction) {
    console.log(`    ${(_id ?? 'unknown').padEnd(24)} ${count}`);
  }
  console.log('═'.repeat(60));

  await mongoose.disconnect();
  console.log('\n👋  Done.');
  process.exit(0);
}

main().catch(err => {
  console.error('❌  Fatal:', err);
  process.exit(1);
});
