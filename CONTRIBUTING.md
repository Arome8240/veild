# Contributing to Veild

Thanks for your interest in contributing!

## Setup

```bash
git clone https://github.com/your-org/veild.git
cd veild
pnpm install
```

## Workflow

1. Fork the repo and create a feature branch from `main`.
2. Make your changes — see the guidelines below.
3. Run `pnpm --filter web exec tsc --noEmit` to verify types.
4. Run `pnpm --filter contracts test` to run the Hardhat test suite.
5. Open a pull request against `main`.

## Commit Style

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(contracts): add VeildGifts virtual gift sending
fix(web): correct useSearch debounce cleanup
test(contracts): add VeildStaking full test suite
docs: update README with new feature table
```

Scopes: `contracts`, `web`, `sdk`, `ci`, `dx`.

## Contracts

- Solidity `^0.8.28` with OpenZeppelin.
- Use `custom errors` instead of `revert strings`.
- Add a Hardhat test file for every new contract.
- Add the contract to `ignition/modules/Veild.ts` and `scripts/deploy.ts`.
- Export the ABI from `packages/veild-sdk/src/abis/`.

## React Hooks

- Place under `apps/web/src/hooks/`.
- Add `"use client"` directive at the top.
- Cast `useReadContract` return values explicitly — the inferred type is `unknown`.

## SDK

- Export new symbols from `packages/veild-sdk/src/index.ts`.
- Add type definitions to `src/types.ts`.
- Run `pnpm --filter veild-sdk build` to verify the build.

## Code Style

- No comments unless the `WHY` is non-obvious.
- No speculative error handling for paths that cannot occur.
- Default to no test mocking — prefer real state where possible.
