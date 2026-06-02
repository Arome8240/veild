import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * Veild deployment module.
 *
 * Deploys in order:
 *   1. VeildRegistry   — creator profiles
 *   2. VeildMessages   — messaging, wall, earnings (depends on Registry)
 *
 * Usage:
 *   pnpm run deploy                      # localhost
 *   pnpm run deploy:celo-sepolia         # Celo Sepolia testnet
 *   pnpm run deploy:celo                 # Celo Mainnet
 */
const VeildModule = buildModule("VeildModule", (m) => {
  // 1. Registry — no constructor args
  const registry = m.contract("VeildRegistry");

  // 2. Messaging — takes the registry address as constructor arg
  const messaging = m.contract("VeildMessages", [registry]);

  return { registry, messaging };
});

export default VeildModule;
