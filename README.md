# Veild

**On-chain creator economy powered by CELO.**

Tip, subscribe, gift, and message creators directly — no middlemen, no censorship.

## Features

| Feature        | Contract             | Description                                           |
|----------------|----------------------|-------------------------------------------------------|
| Messages       | VeildMessages        | Anonymous fan messages with priority tipping          |
| Tips           | VeildTips            | Direct CELO tips with 3% platform fee                 |
| Subscriptions  | VeildSubscriptions   | Tiered monthly access on-chain                        |
| Pools          | VeildPools           | Community funding rounds with goal tracking           |
| Gifts          | VeildGifts           | Virtual gift sending (Rose, Rocket, Crown…)           |
| Staking        | VeildStaking         | Stake CELO for discoverability boost                  |
| Governance     | VeildGovernance      | On-chain proposal and voting system                   |
| Auctions       | VeildAuction         | Timed CELO slot auctions                              |
| Referrals      | VeildReferral        | Earn 0.001 CELO per referred creator                  |
| Badges         | VeildBadges          | Soulbound achievement NFTs                            |

## Monorepo Structure

```
veild/
├── apps/
│   ├── web/          Next.js 15 app (App Router)
│   └── contracts/    Hardhat + Viem + Ignition
└── packages/
    └── veild-sdk/    TypeScript SDK (dual CJS/ESM)
```

## Getting Started

```bash
pnpm install
pnpm dev           # Start web app at localhost:3000
```

### Contracts

```bash
pnpm --filter contracts test        # Run all 28+ test suites
pnpm --filter contracts compile     # Compile Solidity
pnpm --filter contracts deploy:alfajores  # Deploy to Celo testnet
```

### SDK

```bash
pnpm --filter veild-sdk build       # Build CJS + ESM bundles
```

## Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, wagmi v2, viem v2
- **Contracts**: Solidity ^0.8.28, Hardhat, OpenZeppelin, Hardhat Ignition
- **SDK**: tsup (CJS + ESM), TypeScript
- **Monorepo**: Turborepo + pnpm workspaces
- **Chain**: CELO (mainnet + Alfajores testnet)

## Environment Variables

Copy `apps/web/.env.example` and fill in contract addresses:

```env
NEXT_PUBLIC_VEILD_REGISTRY_ADDRESS=0x...
NEXT_PUBLIC_VEILD_MESSAGES_ADDRESS=0x...
# … see .env.example for full list
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT — see [LICENSE](LICENSE).
