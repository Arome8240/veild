import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * Veild full deployment module.
 *
 * Deploys in dependency order:
 *   1. VeildRegistry       — creator profiles (no deps)
 *   2. VeildMessages       — messaging, wall, earnings       (needs Registry)
 *   3. VeildTips           — direct fan-to-creator tips      (needs Registry)
 *   4. VeildSubscriptions  — monthly subscription tiers      (needs Registry)
 *   5. VeildPools          — crowdfunded question pools      (needs Registry)
 *   6. VeildBadges         — soulbound achievement badges    (no deps)
 *   7. VeildGovernance     — proposal and voting contract    (no deps)
 *   8. VeildAuction        — timed slot bidding             (needs Registry)
 *
 * Usage:
 *   pnpm run deploy                      # localhost
 *   pnpm run deploy:celo-sepolia         # Celo Alfajores testnet
 *   pnpm run deploy:celo                 # Celo Mainnet
 */
const VeildModule = buildModule("VeildModule", (m) => {
  // 1. Registry — no constructor args
  const registry = m.contract("VeildRegistry");

  // 2. Messaging — depends on Registry
  const messaging = m.contract("VeildMessages", [registry]);

  // 3. Tips — depends on Registry
  const tips = m.contract("VeildTips", [registry]);

  // 4. Subscriptions — depends on Registry
  const subscriptions = m.contract("VeildSubscriptions", [registry]);

  // 5. Pools — depends on Registry
  const pools = m.contract("VeildPools", [registry]);

  // 6. Badges — standalone (no Registry dep; owner controls awards)
  const badges = m.contract("VeildBadges");

  // 7. Governance — standalone (no Registry dep; anyone can propose)
  const governance = m.contract("VeildGovernance");

  // 8. Auction — depends on Registry (checks creator registration)
  const auctionContract = m.contract("VeildAuction", [registry]);

  return { registry, messaging, tips, subscriptions, pools, badges, governance, auctionContract };
});

export default VeildModule;
