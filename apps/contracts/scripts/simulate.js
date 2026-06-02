/**
 * simulate.js — Veild contract interaction simulator
 *
 * Generates 1000 wallets in MongoDB, funds low-balance accounts from a master
 * wallet, then simulates realistic creator/fan activity against the deployed
 * VeildRegistry and VeildMessages contracts on Celo.
 *
 * Usage:
 *   node scripts/simulate.js                        # run with defaults
 *   node scripts/simulate.js --total 1000 --active 100
 *   node scripts/simulate.js --dry-run              # skip on-chain txs
 *   node scripts/simulate.js --phase register       # only register creators
 *   node scripts/simulate.js --phase simulate       # only run fan/creator sim
 *
 * Required .env:
 *   MONGODB_URI            mongodb connection string
 *   RPC_URL                Celo RPC endpoint
 *   MASTER_PRIVATE_KEY     funded wallet that tops up simulation accounts
 *   VEILD_REGISTRY_ADDRESS deployed VeildRegistry address
 *   VEILD_MESSAGES_ADDRESS deployed VeildMessages address
 */

import { ethers }    from 'ethers';
import mongoose      from 'mongoose';
import dotenv        from 'dotenv';
import { Account, InteractionLog } from './models.js';
dotenv.config();

// ─── Config ───────────────────────────────────────────────────────────────────

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/veild_simulation';
const RPC_URL     = process.env.RPC_URL     || 'https://forno.celo.org';

const REGISTRY_ADDRESS = process.env.VEILD_REGISTRY_ADDRESS;
const MESSAGES_ADDRESS = process.env.VEILD_MESSAGES_ADDRESS;

// CLI args
const args              = process.argv.slice(2);
const DRY_RUN           = args.includes('--dry-run');
const phaseArg          = args.indexOf('--phase');
const ONLY_PHASE        = phaseArg !== -1 ? args[phaseArg + 1] : null; // 'register' | 'simulate' | null
const totalArg          = args.indexOf('--total');
const activeArg         = args.indexOf('--active');
const TOTAL_ACCOUNTS    = totalArg  !== -1 ? parseInt(args[totalArg  + 1]) : 1000;
const ACTIVE_PER_RUN    = activeArg !== -1 ? parseInt(args[activeArg + 1]) : 100;

// Ratios
const CREATOR_RATIO     = 0.10; // 10% of accounts are creators
const PRIORITY_CHANCE   = 0.20; // 20% of fan messages are priority
const REPLY_CHANCE      = 0.60; // creators reply to 60% of inbox messages
const PUBLISH_CHANCE    = 0.50; // 50% of replies get published to wall
const LIKE_CHANCE       = 0.15; // 15% of fans like a wall post each session
const CLAIM_THRESHOLD   = ethers.parseEther('0.0005'); // claim if earnings >= this

// Gas / funding
const FUND_AMOUNT       = ethers.parseEther('0.05');   // sent to each low account
const LOW_THRESHOLD     = ethers.parseEther('0.005');  // refill if below this
const PRIORITY_FEE_ETH  = '0.001';                     // matches contract default
const TX_DELAY_MS       = 500;   // ms between txs — avoids nonce / RPC issues
const GAS_LIMIT_SEND    = 21_000n;
const GAS_LIMIT_CONTRACT= 300_000n;

// ─── Contract ABIs (human-readable) ──────────────────────────────────────────

const REGISTRY_ABI = [
  'function register(string _username, string _name, string _bio, string _avatarCID, string _category) external payable',
  'function isRegistered(address _addr) external view returns (bool)',
  'function getCreator(address _addr) external view returns (tuple(string username, string name, string bio, string avatarCID, string category, uint256 joinedAt, uint256 totalMessages, bool isVerified, bool isActive))',
  'function totalCreators() external view returns (uint256)',
];

const MESSAGES_ABI = [
  'function sendMessage(address _creator, string _content) external',
  'function sendPriorityMessage(address _creator, string _content) external payable',
  'function replyToMessage(uint256 _index, string _reply, bool _publish) external',
  'function publishToWall(uint256 _index) external',
  'function likeWallPost(address _creator, uint256 _wallIndex) external',
  'function claimEarnings() external',
  'function getInbox(address _creator) external view returns (tuple(uint256 id, string content, string reply, bool isPriority, uint256 fee, uint256 sentAt, uint256 repliedAt, bool isAnswered, bool isPublished, bool isArchived)[])',
  'function getWall(address _creator) external view returns (tuple(uint256 id, uint256 messageId, string question, string answer, uint256 likes, uint256 publishedAt)[])',
  'function getEarnings(address _creator) external view returns (uint256)',
  'function hasLiked(address _creator, uint256 _wallIndex, address _user) external view returns (bool)',
  'function priorityFee() external view returns (uint256)',
];

// ─── Fake content pools ───────────────────────────────────────────────────────

const FIRST_NAMES = ['Alex','Jordan','Sam','Taylor','Morgan','Casey','Riley','Avery','Quinn','Blake','Drew','Sage','River','Phoenix','Reese'];
const LAST_NAMES  = ['Rivera','Chen','Taylor','Kim','Patel','Lee','Garcia','Martinez','Nguyen','Wilson','Brown','Davis','Moore','Jackson','White'];
const CATEGORIES  = ['Art & Design','Music','Tech & Education','Gaming','Fitness','Comedy','Cooking','Photography','Writing','Fashion'];
const BIOS = [
  'Creating content and building community one post at a time.',
  'Sharing what I know. Ask me anything.',
  'Full-time creator. Part-time human.',
  'Making things on the internet since forever.',
  'Your questions keep me going. Drop one below.',
];
const FAN_MESSAGES = [
  'What inspired you to start creating?',
  'How do you stay consistent with your content?',
  'What tools do you use every day?',
  'Any advice for someone just starting out?',
  'What was your biggest breakthrough moment?',
  'How do you handle creative blocks?',
  'Do you plan to collab with others soon?',
  'What does your daily routine look like?',
  'How long did it take to find your niche?',
  'Honest question — is it worth pursuing full time?',
  'What would you tell your past self when you started?',
  'Which project are you most proud of?',
  'How do you deal with criticism online?',
  'What\'s something most people get wrong about your field?',
  'Do you ever think about quitting? What keeps you going?',
  'How did you get your first 1000 followers?',
  'What\'s the most underrated skill in your industry?',
  'Would you ever teach what you know?',
  'What\'s next for you?',
  'Any resources you\'d recommend to beginners?',
];
const CREATOR_REPLIES = [
  'Great question! The short answer is: start before you\'re ready.',
  'Honestly, consistency beats perfection every single time.',
  'I\'ve been there. The key for me was focusing on one thing first.',
  'Thank you for asking this — it\'s something I think about a lot.',
  'Real talk: it took way longer than I expected, but it was worth it.',
  'The best thing you can do is ship something imperfect today.',
  'I still ask myself that. The community is what keeps me showing up.',
  'Find one person your content truly helps. That\'s your anchor.',
  'Took me two years to feel like I knew what I was doing. Keep going.',
  'The tools matter less than the habit. Just start.',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const rand  = (arr) => arr[Math.floor(Math.random() * arr.length)];
const coinFlip = (p) => Math.random() < p;
const delay = (ms) => new Promise(r => setTimeout(r, ms));
const fmt   = (wei) => ethers.formatEther(wei);
const shortAddr = (addr) => `${addr.slice(0,6)}…${addr.slice(-4)}`;

function log(prefix, msg) { console.log(`${prefix} ${msg}`); }

async function getOrCreateWallet(acct, provider) {
  return new ethers.Wallet(acct.privateKey, provider);
}

async function ensureFunded(wallet, provider, masterWallet, label) {
  const balance = await provider.getBalance(wallet.address);
  if (balance >= LOW_THRESHOLD || DRY_RUN) return balance;

  log('  💸', `${label} low balance (${fmt(balance)} CELO) — funding from master…`);

  try {
    const tx = await masterWallet.sendTransaction({
      to:       wallet.address,
      value:    FUND_AMOUNT,
      gasLimit: GAS_LIMIT_SEND,
    });
    log('  ⏳', `Fund tx: ${tx.hash}`);
    await tx.wait();
    await InteractionLog.create({
      accountAddress: masterWallet.address,
      toAddress:      wallet.address,
      actionType:     'fund',
      status:         'success',
      meta:           { amount: fmt(FUND_AMOUNT) },
    });
    log('  ✅', `Funded ${fmt(FUND_AMOUNT)} CELO`);
    return await provider.getBalance(wallet.address);
  } catch (err) {
    log('  ❌', `Fund failed: ${err.shortMessage || err.message}`);
    return balance;
  }
}

// ─── Phase 1: Generate accounts ───────────────────────────────────────────────

async function generateAccounts() {
  const existing = await Account.countDocuments();
  if (existing >= TOTAL_ACCOUNTS) {
    log('✅', `${existing} accounts already in DB — skipping generation.`);
    return;
  }

  const needed = TOTAL_ACCOUNTS - existing;
  log('🛠️ ', `Generating ${needed} new accounts…`);

  const docs = [];
  const creatorCount = Math.floor(TOTAL_ACCOUNTS * CREATOR_RATIO);

  for (let i = 0; i < needed; i++) {
    const globalIndex = existing + i;
    const wallet   = ethers.Wallet.createRandom();
    const isCreator = globalIndex < creatorCount;
    const firstName = rand(FIRST_NAMES);
    const lastName  = rand(LAST_NAMES);
    const suffix    = globalIndex.toString().padStart(4, '0');
    const username  = isCreator
      ? `${firstName.toLowerCase()}_${suffix}`
      : null;

    docs.push({
      address:    wallet.address,
      privateKey: wallet.privateKey,
      role:       isCreator ? 'creator' : 'fan',
      username,
      network:    'celo',
    });

    if ((i + 1) % 100 === 0) log('   ', `Generated ${i + 1}/${needed}…`);
  }

  await Account.insertMany(docs);
  log('✅', `Saved ${docs.length} accounts.`);
}

// ─── Phase 2: Register creators on-chain ─────────────────────────────────────

async function registerCreators(provider, masterWallet) {
  if (!REGISTRY_ADDRESS) {
    log('⚠️ ', 'VEILD_REGISTRY_ADDRESS not set — skipping creator registration.');
    return;
  }

  const creators = await Account.find({ role: 'creator', isRegistered: false });
  if (creators.length === 0) {
    log('✅', 'All creators already registered.');
    return;
  }

  log('📋', `Registering ${creators.length} creators on VeildRegistry…`);

  for (let i = 0; i < creators.length; i++) {
    const acct  = creators[i];
    const label = `[${i + 1}/${creators.length}] ${shortAddr(acct.address)}`;

    const wallet   = await getOrCreateWallet(acct, provider);
    const balance  = await ensureFunded(wallet, provider, masterWallet, label);

    if (balance < LOW_THRESHOLD) {
      log(label, '⚠️  Still no funds after top-up — skipping.');
      continue;
    }

    const firstName = rand(FIRST_NAMES);
    const lastName  = rand(LAST_NAMES);
    const name      = `${firstName} ${lastName}`;

    try {
      if (!DRY_RUN) {
        const registry = new ethers.Contract(REGISTRY_ADDRESS, REGISTRY_ABI, wallet);
        const alreadyReg = await registry.isRegistered(acct.address);

        if (alreadyReg) {
          log(label, 'Already registered on-chain.');
          await Account.updateOne({ address: acct.address }, { isRegistered: true });
          continue;
        }

        const tx = await registry.register(
          acct.username,
          name,
          rand(BIOS),
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${acct.username}`,
          rand(CATEGORIES),
          { gasLimit: GAS_LIMIT_CONTRACT }
        );
        log(label, `register tx: ${tx.hash}`);
        const receipt = await tx.wait();

        if (receipt.status === 1) {
          await Account.updateOne({ address: acct.address }, { isRegistered: true });
          await InteractionLog.create({
            txHash: receipt.hash, accountAddress: acct.address,
            actionType: 'register', status: 'success',
            gasUsed: receipt.gasUsed?.toString(),
          });
          log(label, `✅ Registered as @${acct.username}`);
        } else {
          throw new Error('tx reverted');
        }
      } else {
        log(label, `[dry-run] Would register @${acct.username}`);
      }
    } catch (err) {
      log(label, `❌ ${err.shortMessage || err.message}`);
      await InteractionLog.create({
        accountAddress: acct.address, actionType: 'register',
        status: 'failed', errorMsg: err.shortMessage || err.message,
      });
    }

    await delay(TX_DELAY_MS);
  }
}

// ─── Phase 3: Simulate interactions ──────────────────────────────────────────

async function simulateFan(acct, registeredCreators, provider, masterWallet, index, total) {
  const label = `[fan ${index}/${total}] ${shortAddr(acct.address)}`;
  const wallet = await getOrCreateWallet(acct, provider);
  const balance = await ensureFunded(wallet, provider, masterWallet, label);

  if (balance < LOW_THRESHOLD && !DRY_RUN) {
    log(label, '⚠️  Still no funds — skipping.');
    return;
  }

  if (registeredCreators.length === 0) {
    log(label, '⚠️  No registered creators yet — skipping.');
    return;
  }

  const messages = new ethers.Contract(MESSAGES_ADDRESS, MESSAGES_ABI, wallet);
  const targetCreator = rand(registeredCreators);
  const content       = rand(FAN_MESSAGES);

  // ── Send message (free or priority) ─────────────────────────────────────────
  const isPriority = coinFlip(PRIORITY_CHANCE);
  const action = isPriority ? 'sendPriorityMessage' : 'sendMessage';

  try {
    if (!DRY_RUN) {
      let tx;
      if (isPriority) {
        tx = await messages.sendPriorityMessage(targetCreator.address, content, {
          value:    ethers.parseEther(PRIORITY_FEE_ETH),
          gasLimit: GAS_LIMIT_CONTRACT,
        });
      } else {
        tx = await messages.sendMessage(targetCreator.address, content, {
          gasLimit: GAS_LIMIT_CONTRACT,
        });
      }
      log(label, `${isPriority ? '⚡' : '✉️ '} ${action} → @${targetCreator.username} (${tx.hash.slice(0, 12)}…)`);
      const receipt = await tx.wait();

      await InteractionLog.create({
        txHash: receipt.hash, accountAddress: acct.address,
        toAddress: targetCreator.address, actionType: action,
        status: receipt.status === 1 ? 'success' : 'failed',
        gasUsed: receipt.gasUsed?.toString(),
        meta: { content: content.slice(0, 60), priority: isPriority },
      });

      await Account.updateOne({ address: acct.address }, {
        $inc: { interactionCount: 1 }, lastInteraction: new Date(),
      });
    } else {
      log(label, `[dry-run] Would ${action} → @${targetCreator.username}`);
    }
  } catch (err) {
    log(label, `❌ ${action}: ${err.shortMessage || err.message}`);
    await InteractionLog.create({
      accountAddress: acct.address, toAddress: targetCreator.address,
      actionType: action, status: 'failed',
      errorMsg: err.shortMessage || err.message,
    });
  }

  await delay(TX_DELAY_MS);

  // ── Optionally like a wall post ────────────────────────────────────────────
  if (coinFlip(LIKE_CHANCE)) {
    const likeTarget = rand(registeredCreators);
    try {
      if (!DRY_RUN) {
        const wall = await messages.getWall(likeTarget.address);
        if (wall.length > 0) {
          const wallIndex = BigInt(Math.floor(Math.random() * wall.length));
          const alreadyLiked = await messages.hasLiked(likeTarget.address, wallIndex, acct.address);
          if (!alreadyLiked) {
            const tx = await messages.likeWallPost(likeTarget.address, wallIndex, {
              gasLimit: GAS_LIMIT_CONTRACT,
            });
            const receipt = await tx.wait();
            log(label, `❤️  liked wall post #${wallIndex} of @${likeTarget.username}`);
            await InteractionLog.create({
              txHash: receipt.hash, accountAddress: acct.address,
              toAddress: likeTarget.address, actionType: 'likeWallPost',
              status: receipt.status === 1 ? 'success' : 'failed',
              meta: { wallIndex: wallIndex.toString() },
            });
          }
        }
      } else {
        log(label, `[dry-run] Would like a post of @${likeTarget.username}`);
      }
    } catch (err) {
      log(label, `❌ like: ${err.shortMessage || err.message}`);
    }
    await delay(TX_DELAY_MS);
  }
}

async function simulateCreator(acct, provider, masterWallet, index, total) {
  const label = `[creator ${index}/${total}] @${acct.username}`;
  const wallet  = await getOrCreateWallet(acct, provider);
  const balance = await ensureFunded(wallet, provider, masterWallet, label);

  if (balance < LOW_THRESHOLD && !DRY_RUN) {
    log(label, '⚠️  No funds — skipping.');
    return;
  }

  const messages = new ethers.Contract(MESSAGES_ADDRESS, MESSAGES_ABI, wallet);

  // ── Fetch inbox and reply to unanswered messages ───────────────────────────
  try {
    let inbox = [];
    if (!DRY_RUN) {
      inbox = await messages.getInbox(acct.address);
    } else {
      log(label, '[dry-run] Would fetch inbox and reply to messages');
      return;
    }

    const unanswered = inbox
      .map((m, i) => ({ ...m, _index: i }))
      .filter(m => !m.isAnswered && !m.isArchived);

    if (unanswered.length === 0) {
      log(label, 'inbox clean — nothing to reply to');
    } else {
      log(label, `inbox: ${inbox.length} total, ${unanswered.length} unanswered`);
    }

    for (const msg of unanswered) {
      if (!coinFlip(REPLY_CHANCE)) continue;

      const reply   = rand(CREATOR_REPLIES);
      const publish = coinFlip(PUBLISH_CHANCE);

      try {
        const tx = await messages.replyToMessage(
          BigInt(msg._index),
          reply,
          publish,
          { gasLimit: GAS_LIMIT_CONTRACT }
        );
        const receipt = await tx.wait();
        log(label, `💬 replied to msg #${msg._index}${publish ? ' (published to wall)' : ''} (${tx.hash.slice(0,12)}…)`);
        await InteractionLog.create({
          txHash: receipt.hash, accountAddress: acct.address,
          actionType: 'replyToMessage',
          status: receipt.status === 1 ? 'success' : 'failed',
          gasUsed: receipt.gasUsed?.toString(),
          meta: { msgIndex: msg._index, published: publish },
        });
        await delay(TX_DELAY_MS);
      } catch (err) {
        log(label, `❌ reply msg #${msg._index}: ${err.shortMessage || err.message}`);
      }
    }

    // ── Claim earnings if above threshold ────────────────────────────────────
    const earnings = await messages.getEarnings(acct.address);
    if (earnings >= CLAIM_THRESHOLD) {
      try {
        const tx = await messages.claimEarnings({ gasLimit: GAS_LIMIT_CONTRACT });
        const receipt = await tx.wait();
        log(label, `💰 claimed ${fmt(earnings)} CELO earnings`);
        await InteractionLog.create({
          txHash: receipt.hash, accountAddress: acct.address,
          actionType: 'claimEarnings', status: 'success',
          meta: { amount: fmt(earnings) },
        });
      } catch (err) {
        log(label, `❌ claimEarnings: ${err.shortMessage || err.message}`);
      }
      await delay(TX_DELAY_MS);
    }

    await Account.updateOne({ address: acct.address }, {
      $inc: { interactionCount: 1 }, lastInteraction: new Date(),
    });
  } catch (err) {
    log(label, `❌ getInbox: ${err.shortMessage || err.message}`);
  }
}

async function runSimulation(provider, masterWallet) {
  if (!MESSAGES_ADDRESS) {
    log('⚠️ ', 'VEILD_MESSAGES_ADDRESS not set — skipping simulation.');
    return;
  }

  // All registered creators (used as message targets for fans)
  const registeredCreators = await Account.find({ role: 'creator', isRegistered: true });
  log('📋', `${registeredCreators.length} registered creators available as targets`);

  // Pick random active accounts for this session
  const allAccounts  = await Account.find({});
  const shuffled     = allAccounts.sort(() => 0.5 - Math.random());
  const activeAccounts = shuffled.slice(0, Math.min(ACTIVE_PER_RUN, allAccounts.length));

  const activeFans     = activeAccounts.filter(a => a.role === 'fan');
  const activeCreators = activeAccounts.filter(a => a.role === 'creator' && a.isRegistered);

  log('🚀', `Session: ${activeFans.length} fans + ${activeCreators.length} creators active`);

  // Fans first
  for (let i = 0; i < activeFans.length; i++) {
    await simulateFan(activeFans[i], registeredCreators, provider, masterWallet, i + 1, activeFans.length);
  }

  // Then creators check inbox and claim earnings
  for (let i = 0; i < activeCreators.length; i++) {
    await simulateCreator(activeCreators[i], provider, masterWallet, i + 1, activeCreators.length);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // Validate env
  if (!process.env.MASTER_PRIVATE_KEY) {
    console.error('❌  Set MASTER_PRIVATE_KEY in .env — needed to fund simulation accounts.');
    process.exit(1);
  }

  console.log('─'.repeat(72));
  console.log('  🪄  Veild Simulation');
  console.log('─'.repeat(72));
  console.log(`  Network   : ${RPC_URL}`);
  console.log(`  Registry  : ${REGISTRY_ADDRESS ?? '(not set)'}`);
  console.log(`  Messages  : ${MESSAGES_ADDRESS ?? '(not set)'}`);
  console.log(`  Accounts  : ${TOTAL_ACCOUNTS} total, ${ACTIVE_PER_RUN} active/session`);
  if (DRY_RUN)   console.log('  🔍 DRY RUN — no on-chain transactions');
  if (ONLY_PHASE) console.log(`  Phase     : ${ONLY_PHASE} only`);
  console.log('─'.repeat(72) + '\n');

  // Connect
  console.log('🔌  Connecting to MongoDB…');
  await mongoose.connect(MONGODB_URI);
  console.log('✅  Connected\n');

  const provider     = new ethers.JsonRpcProvider(RPC_URL);
  const masterWallet = new ethers.Wallet(process.env.MASTER_PRIVATE_KEY, provider);
  const masterBal    = await provider.getBalance(masterWallet.address);

  console.log(`💼  Master wallet : ${masterWallet.address}`);
  console.log(`💰  Master balance: ${fmt(masterBal)} CELO\n`);

  if (masterBal === 0n && !DRY_RUN) {
    console.error('❌  Master wallet has no CELO. Fund it first.');
    process.exit(1);
  }

  // Phases
  if (!ONLY_PHASE || ONLY_PHASE === 'generate') {
    console.log('═'.repeat(60));
    console.log('  Phase 1 — Generate accounts');
    console.log('═'.repeat(60));
    await generateAccounts();
  }

  if (!ONLY_PHASE || ONLY_PHASE === 'register') {
    console.log('\n' + '═'.repeat(60));
    console.log('  Phase 2 — Register creators on-chain');
    console.log('═'.repeat(60));
    await registerCreators(provider, masterWallet);
  }

  if (!ONLY_PHASE || ONLY_PHASE === 'simulate') {
    console.log('\n' + '═'.repeat(60));
    console.log('  Phase 3 — Simulate fan/creator interactions');
    console.log('═'.repeat(60));
    await runSimulation(provider, masterWallet);
  }

  // Summary
  const [totalLogs, successLogs, failedLogs] = await Promise.all([
    InteractionLog.countDocuments(),
    InteractionLog.countDocuments({ status: 'success' }),
    InteractionLog.countDocuments({ status: 'failed' }),
  ]);

  const byAction = await InteractionLog.aggregate([
    { $group: { _id: '$actionType', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  console.log('\n' + '═'.repeat(60));
  console.log('  SIMULATION SUMMARY');
  console.log('═'.repeat(60));
  console.log(`  Total interactions logged : ${totalLogs}`);
  console.log(`  Success                   : ${successLogs}`);
  console.log(`  Failed                    : ${failedLogs}`);
  console.log('\n  By action:');
  for (const { _id, count } of byAction) {
    console.log(`    ${(_id ?? 'unknown').padEnd(22)} ${count}`);
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
