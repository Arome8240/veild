/**
 * Standalone verification script — re-verifies already-deployed contracts.
 *
 * Usage:
 *   npx hardhat run scripts/verify.ts --network celo-sepolia
 *   npx hardhat run scripts/verify.ts --network celo
 *
 * Reads the saved deployment JSON from deployments/{network}.json
 * and submits all contracts to Celoscan for source-code verification.
 */

import hre from "hardhat";
import * as fs from "fs";
import * as path from "path";

interface DeployedContracts {
  VeildRegistry:      string;
  VeildMessages:      string;
  VeildTips:          string;
  VeildSubscriptions: string;
  VeildPools:         string;
}

async function verifyOne(
  name: string,
  address: string,
  constructorArgs: unknown[]
) {
  console.log(`\n  Verifying ${name}...`);
  await hre
    .run("verify:verify", { address, constructorArguments: constructorArgs })
    .then(() => console.log(`  ✔  ${name} verified`))
    .catch((e: Error) => {
      if (e.message.includes("Already Verified")) {
        console.log(`  ℹ  ${name}: already verified.`);
      } else {
        console.error(`  ✗  ${name}: failed — ${e.message}`);
      }
    });
}

async function main() {
  const networkName = hre.network.name;

  if (networkName === "localhost" || networkName === "hardhat") {
    throw new Error("Verification is only available on live networks.");
  }

  // Load saved addresses
  const jsonPath = path.join(__dirname, "..", "deployments", `${networkName}.json`);

  if (!fs.existsSync(jsonPath)) {
    throw new Error(
      `No deployment found for "${networkName}". Run scripts/deploy.ts first.`
    );
  }

  const deployment: { contracts: DeployedContracts } = JSON.parse(
    fs.readFileSync(jsonPath, "utf-8")
  );

  const {
    VeildRegistry,
    VeildMessages,
    VeildTips,
    VeildSubscriptions,
    VeildPools,
  } = deployment.contracts;

  console.log(`\nVerifying Veild contracts on ${networkName}:`);
  console.log(`  VeildRegistry      : ${VeildRegistry}`);
  console.log(`  VeildMessages      : ${VeildMessages}`);
  console.log(`  VeildTips          : ${VeildTips ?? "(not deployed)"}`);
  console.log(`  VeildSubscriptions : ${VeildSubscriptions ?? "(not deployed)"}`);
  console.log(`  VeildPools         : ${VeildPools ?? "(not deployed)"}`);

  // ── 1. VeildRegistry ─────────────────────────────────────────────────────
  await verifyOne("VeildRegistry", VeildRegistry, []);

  // ── 2. VeildMessages ─────────────────────────────────────────────────────
  await verifyOne("VeildMessages", VeildMessages, [VeildRegistry]);

  // ── 3. VeildTips ─────────────────────────────────────────────────────────
  if (VeildTips) {
    await verifyOne("VeildTips", VeildTips, [VeildRegistry]);
  }

  // ── 4. VeildSubscriptions ────────────────────────────────────────────────
  if (VeildSubscriptions) {
    await verifyOne("VeildSubscriptions", VeildSubscriptions, [VeildRegistry]);
  }

  // ── 5. VeildPools ────────────────────────────────────────────────────────
  if (VeildPools) {
    await verifyOne("VeildPools", VeildPools, [VeildRegistry]);
  }

  console.log("\n✅  Done.");
}

main().catch((error) => {
  console.error("Verification failed:", error.message ?? error);
  process.exitCode = 1;
});
