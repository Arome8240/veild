/**
 * sweep.ts — Consolidate CELO from simulation wallets back to a master wallet.
 *
 * Reads every account from MongoDB, checks its on-chain balance, and sends
 * the full balance minus gas cost to MASTER_ADDRESS.
 *
 * Usage:
 *   npx ts-node scripts/sweep.ts              # live run
 *   npx ts-node scripts/sweep.ts --dry-run    # preview only, no txs sent
 *   npx ts-node scripts/sweep.ts --batch 10   # override concurrent batch size
 *
 * Required env vars (.env):
 *   MONGODB_URI       — e.g. mongodb://localhost:27017/caresplit_simulation
 *   MASTER_ADDRESS    — destination wallet address  (or derived from MASTER_PRIVATE_KEY)
 *   RPC_URL           — Celo RPC endpoint
 *
 * Optional:
 *   MASTER_PRIVATE_KEY — if MASTER_ADDRESS is not set, it is derived from this
 */

import { ethers } from "ethers";
import mongoose, { Schema, model, Document } from "mongoose";
import dotenv from "dotenv";
dotenv.config();

// ─── Config ───────────────────────────────────────────────────────────────────

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/caresplit_simulation";
const RPC_URL = process.env.RPC_URL || "https://forno.celo.org";

// Resolve master address from env
let MASTER_ADDRESS = process.env.MASTER_ADDRESS ?? "";
if (!MASTER_ADDRESS && process.env.MASTER_PRIVATE_KEY) {
  MASTER_ADDRESS = new ethers.Wallet(process.env.MASTER_PRIVATE_KEY).address;
}

// CLI flags
const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const batchArg = args.indexOf("--batch");
const BATCH_SIZE = batchArg !== -1 ? parseInt(args[batchArg + 1]) || 5 : 5;
const DELAY_MS = 300; // ms between individual txs in a batch to avoid nonce issues
const GAS_REFRESH_EVERY = 20; // refresh gas price every N accounts
const GAS_LIMIT = 21_000n;
const DUST_THRESHOLD = ethers.parseEther("0.0001"); // skip wallets below this

// ─── Mongoose model (mirror of your existing Account model) ───────────────────

interface IAccount extends Document {
  address: string;
  privateKey: string;
  interactionCount: number;
  lastInteraction?: Date;
}

const AccountSchema = new Schema<IAccount>({
  address: String,
  privateKey: String,
  interactionCount: { type: Number, default: 0 },
  lastInteraction: Date,
});

const Account = model<IAccount>("Account", AccountSchema);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(wei: bigint) {
  return ethers.formatEther(wei);
}

function pad(s: string, n: number) {
  return s.length >= n ? s : s + " ".repeat(n - s.length);
}

async function getGasCost(provider: ethers.JsonRpcProvider): Promise<bigint> {
  const fee = await provider.getFeeData();
  // Use maxFeePerGas for EIP-1559 networks (Celo supports it); fall back to gasPrice
  const pricePerGas = fee.maxFeePerGas ?? fee.gasPrice ?? 0n;
  return pricePerGas * GAS_LIMIT;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (!MASTER_ADDRESS) {
    console.error(
      "❌  Set MASTER_ADDRESS (or MASTER_PRIVATE_KEY) in your .env file."
    );
    process.exit(1);
  }

  // Validate address
  try {
    MASTER_ADDRESS = ethers.getAddress(MASTER_ADDRESS);
  } catch {
    console.error("❌  MASTER_ADDRESS is not a valid Ethereum address.");
    process.exit(1);
  }

  // ── Connect ──────────────────────────────────────────────────────────────────

  console.log("🔌  Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("✅  Connected to MongoDB");

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  await provider.getNetwork(); // validate RPC

  const accounts = await Account.find({}).lean();
  const total = accounts.length;

  console.log(`\n📋  Found ${total} accounts in database`);
  console.log(`🎯  Master address : ${MASTER_ADDRESS}`);
  console.log(`⛽  Gas limit      : ${GAS_LIMIT.toLocaleString()} units`);
  console.log(`📦  Batch size     : ${BATCH_SIZE}`);
  if (DRY_RUN) console.log("\n🔍  DRY RUN — no transactions will be sent");
  console.log("─".repeat(72));

  // Initial gas estimate
  let gasCost = await getGasCost(provider);
  console.log(`⛽  Gas cost/tx    : ${fmt(gasCost)} CELO\n`);

  // ── Sweep ────────────────────────────────────────────────────────────────────

  let totalSwept = 0n;
  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  const failed: { address: string; reason: string }[] = [];

  for (let i = 0; i < total; i++) {
    const acct = accounts[i];
    const label = `[${String(i + 1).padStart(String(total).length, "0")}/${total}]`;

    // Refresh gas price periodically
    if (i > 0 && i % GAS_REFRESH_EVERY === 0) {
      gasCost = await getGasCost(provider);
    }

    try {
      const balance = await provider.getBalance(acct.address);
      const sendable = balance - gasCost;

      if (balance <= DUST_THRESHOLD || sendable <= 0n) {
        console.log(
          `${label} ${pad(acct.address, 44)}  ${pad(fmt(balance), 20)} CELO  → skip (dust)`
        );
        skipCount++;
        continue;
      }

      if (DRY_RUN) {
        console.log(
          `${label} ${pad(acct.address, 44)}  ${pad(fmt(balance), 20)} CELO  → would send ${fmt(sendable)} CELO`
        );
        totalSwept += sendable;
        successCount++;
        continue;
      }

      const wallet = new ethers.Wallet(acct.privateKey, provider);

      const tx = await wallet.sendTransaction({
        to: MASTER_ADDRESS,
        value: sendable,
        gasLimit: GAS_LIMIT,
      });

      console.log(
        `${label} ${pad(acct.address, 44)}  ${pad(fmt(balance), 20)} CELO  → sent ${fmt(sendable)} CELO  (${tx.hash})`
      );

      const receipt = await tx.wait();

      if (receipt?.status === 1) {
        totalSwept += sendable;
        successCount++;
        console.log(`${"".padStart(label.length + 1)}✅  confirmed in block ${receipt.blockNumber}`);
      } else {
        errorCount++;
        failed.push({ address: acct.address, reason: "tx reverted" });
        console.log(`${"".padStart(label.length + 1)}❌  tx reverted`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? (err as any).shortMessage ?? err.message : String(err);
      errorCount++;
      failed.push({ address: acct.address, reason: msg });
      console.log(`${label} ${acct.address}  ❌  ${msg}`);
    }

    // Pace requests so we don't hit RPC rate limits
    if (i < total - 1) {
      await new Promise((r) => setTimeout(r, DELAY_MS));
    }
  }

  // ── Summary ──────────────────────────────────────────────────────────────────

  console.log("\n" + "─".repeat(72));
  console.log("  SWEEP SUMMARY");
  console.log("─".repeat(72));
  console.log(`  Accounts processed : ${total}`);
  console.log(`  Swept              : ${successCount}`);
  console.log(`  Skipped (dust)     : ${skipCount}`);
  console.log(`  Failed             : ${errorCount}`);
  console.log(
    `  Total recovered    : ${fmt(totalSwept)} CELO${DRY_RUN ? " (estimated)" : ""}`
  );

  if (failed.length > 0) {
    console.log("\n  Failed accounts:");
    for (const f of failed) {
      console.log(`    ${f.address}  — ${f.reason}`);
    }
  }

  console.log("─".repeat(72));

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("❌  Fatal error:", err);
  process.exit(1);
});
