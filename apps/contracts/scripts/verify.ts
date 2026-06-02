/**
 * Standalone verification script — re-verifies already-deployed contracts.
 *
 * Usage:
 *   npx hardhat run scripts/verify.ts --network celo-sepolia
 *   npx hardhat run scripts/verify.ts --network celo
 *
 * Reads the saved deployment JSON from deployments/{network}.json
 * and submits both contracts to Celoscan for source-code verification.
 */

import hre from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const networkName = hre.network.name;

  if (networkName === "localhost" || networkName === "hardhat") {
    throw new Error("Verification is only available on live networks.");
  }

  // Load saved addresses
  const jsonPath = path.join(
    __dirname,
    "..",
    "deployments",
    `${networkName}.json`
  );

  if (!fs.existsSync(jsonPath)) {
    throw new Error(
      `No deployment found for "${networkName}". ` +
        `Run scripts/deploy.ts first.`
    );
  }

  const deployment: {
    contracts: { VeildRegistry: string; VeildMessages: string };
  } = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));

  const { VeildRegistry, VeildMessages } = deployment.contracts;

  console.log(`\nVerifying on ${networkName}...`);
  console.log(`  VeildRegistry : ${VeildRegistry}`);
  console.log(`  VeildMessages : ${VeildMessages}`);

  // ── VeildRegistry ─────────────────────────────────────────────────────────
  console.log("\n[1/2] Verifying VeildRegistry...");
  await hre
    .run("verify:verify", {
      address: VeildRegistry,
      constructorArguments: [],
    })
    .then(() => console.log("  ✔  Verified"))
    .catch((e: Error) => {
      if (e.message.includes("Already Verified")) {
        console.log("  ℹ  Already verified.");
      } else {
        console.error("  ✗  Failed:", e.message);
      }
    });

  // ── VeildMessages ─────────────────────────────────────────────────────────
  console.log("\n[2/2] Verifying VeildMessages...");
  await hre
    .run("verify:verify", {
      address: VeildMessages,
      constructorArguments: [VeildRegistry],
    })
    .then(() => console.log("  ✔  Verified"))
    .catch((e: Error) => {
      if (e.message.includes("Already Verified")) {
        console.log("  ℹ  Already verified.");
      } else {
        console.error("  ✗  Failed:", e.message);
      }
    });

  console.log("\n✅  Done.");
}

main().catch((error) => {
  console.error("Verification failed:", error.message ?? error);
  process.exitCode = 1;
});
