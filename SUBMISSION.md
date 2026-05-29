# 🧠 CipherMind — WaveHack Submission

> **A privacy-first AI operating system: autonomous Hermes agents that reason, collaborate, and act on encrypted data — and a full confidential-finance suite — without ever exposing the underlying numbers.** Live on Arbitrum Sepolia, powered by Fhenix CoFHE + Nous Hermes.

---

## 1. The problem

Public chains expose every amount — balances, salaries, debt, votes, credit, reputation — and most "AI for crypto" tools demand your rawest data. CipherMind keeps the *numbers* encrypted end-to-end (FHE) while staying fully on-chain, and layers autonomous AI agents on top that reason over a sealed channel.

## 2. What it is — 16 surfaces, two layers

### Confidential-finance layer (on-chain FHE)
| Surface | What stays encrypted | FHE move |
|---------|----------------------|----------|
| **Payments** (vault) | balance + transfer amount | overdraft → `FHE.select` moves 0 (no leak) |
| **Payroll** | each salary | per-recipient ACL; claim accrues encrypted |
| **Lending** | collateral, debt, health | 75% LTV via `FHE.lte`; over-borrow clamps to 0 |
| **Requests** | amount (public memo) | encrypted ask, payer fulfills |
| **Crowdfund** | goal + total | encrypted aggregate, public participation |
| **Escrow** | amount | 2-of-2 + arbiter |
| **Governance** | individual votes | only the encrypted tally is stored; public reveal on finalize |
| **Reputation** | trust score | encrypted attestations; prove ≥ threshold |
| **Credit · Trading** | inputs → score/signal | oracle decrypts via permit → Hermes → encrypted result |

### Autonomous-AI layer
| Surface | Capability |
|---------|-----------|
| **Agents** | 7 specialized Hermes agents; planner → delegate → synthesize; confidence + reasoning-trace audit log |
| **Automation** | AI proposes/simulates actions; safety harness (approval mode, spending limit, emergency stop, risk threshold) gates execution |
| **Memory** | persistent agent memory, AES-GCM encrypted at rest with a wallet-derived key; memory-aware answers |
| **Wallet** | on-chain exposure + approval scanner with one-click revoke + AI risk read |
| **Live** | realtime chain + market intelligence with a Hermes read of the snapshot |
| **Market** | install / save / share agent-workflow templates that run on the council |
| **Research** | multi-step tool-using Hermes research agent |

## 3. Why FHE (not just ZK)

These features need the contract to *compute* on private values — add balances, compare debt to an LTV, tally votes, accrue reputation, score a profile. FHE lets the contract do arithmetic and comparisons directly on ciphertext; ZK only proves a statement. That's the whole point of the product message: **agents reason, collaborate, and act on encrypted data without exposing it.**

## 4. Architecture

- **Contracts** (Solidity 0.8.25, `@fhenixprotocol/cofhe-contracts`): EncryptedVault, ConfidentialPayroll, ConfidentialLending, PaymentRequests, Crowdfund, ConfidentialEscrow, EncryptedGovernance, ReputationRegistry, CipherMindCredit, CipherMindTrading, MockUSDC.
- **Off-chain oracle** (`backend/oracleLogic.ts`, `npx hardhat oracle`): for the AI scoring surfaces — decrypt via permit → anonymize → Nous Hermes → re-encrypt → fulfill.
- **Frontend** (Vite + React 19 + TS): `@cofhe/sdk/web` encrypts/unseals in-browser; single surfaces-grid UI with the ████ sealed-amount motif, manual dark/light, and live agent/thinking indicators. Multi-agent council, autonomous engine, encrypted memory, realtime feed, wallet analytics all run client-side over the existing Nous + public RPC + free CoinGecko sources.
- **AI**: Nous `hermes-4-70b`.

## 5. Status — verified

- ✅ **64 contract tests pass** on the CoFHE mocks (every contract + confidential primitive).
- ✅ **Live on Arbitrum Sepolia**; `npx hardhat e2e --network arb-sepolia` runs a full encrypted flow with a real Hermes call.
- ✅ Frontend type-checks + builds (bundles the CoFHE `tfhe` WASM runtime).

### Deployed contracts (Arbitrum Sepolia)
| Contract | Address |
|----------|---------|
| MockUSDC | `0xD634Ba983dE5cB66a65eBb113e4aBA36663af75E` |
| EncryptedVault | `0x1FEE1713517C0d33c01E63D3Af8ed4789a3eA1E6` |
| ConfidentialPayroll | `0x776B7Bc2086b75ce0603d402C2f1c0655c0A26C7` |
| ConfidentialLending | `0x897A2406C9b2FB897bEBb9Bc7c728b303300F1D4` |
| PaymentRequests | `0x90C7d251Bcd542Ec01d0ea84A57b634aC3B394dF` |
| Crowdfund | `0x02E6043e09b462C55fb0cf0307be361F9b3BD574` |
| ConfidentialEscrow | `0xc7486168DE600EfCdd85c1Fd2fb748cbA8586323` |
| EncryptedGovernance | `0xd98ca7C68bc571a0504e30579c0B8fBF3C8690dd` |
| ReputationRegistry | `0xE51b8D36F2DC2B512680A2045662C8E75BB61a11` |
| CipherMindCredit | `0x1128E66806605bCEf7836147C60a222CDa47cA53` |
| CipherMindTrading | `0x6f281299127c72BF4fF5A4B16408CE615200aD7E` |

## 6. Demo script (~3 min)

> Connect MetaMask (auto-switches to Arbitrum Sepolia).

1. **Agents** → ask *"Should I rotate treasury into stablecoins given current risk?"* → watch the council plan → delegate → synthesize with confidence + trace.
2. **Automation** → set a goal, **Plan**, toggle **Emergency stop** to lock all actions, or set a tiny spending limit to see actions blocked with reasons.
3. **Payments** → deposit → balance shows `████` → unseal → private send.
4. **Governance** → create proposal → encrypted YES/NO votes → finalize → reveal aggregate tally only.
5. **Reputation** → attest to an address → prove "reputation ≥ 50" without revealing it.
6. **Live** → real prices + the Arbitrum block ticking + AI market read.
7. **Memory** → unlock (sign) → add a preference → ask and watch the AI recall it.

## 7. Run it

```bash
npm install && npx hardhat test                 # 64 passing on mocks
# deploy (each task prints addresses → put in .env + frontend/.env)
npx hardhat deploy-vault            --network arb-sepolia
npx hardhat deploy-payroll-lending  --network arb-sepolia
npx hardhat deploy-surfaces         --network arb-sepolia
npx hardhat deploy-governance       --network arb-sepolia
npx hardhat deploy-reputation       --network arb-sepolia
npx hardhat deploy-credit           --network arb-sepolia
npx hardhat deploy-trading          --network arb-sepolia
npx hardhat verify-all              --network arb-sepolia   # needs ARBISCAN_API_KEY
npm run oracle                                  # for credit/trading (keep open)
cd frontend && npm install && npm run dev
```

## 8. Honest scope

The autonomous-AI layer runs on the existing Nous integration + public RPC + free CoinGecko (no paid key). True push WebSockets / whale-and-mempool tracking, a hosted vector DB for memory, and full multi-token portfolio/rug-pull analytics need a paid data provider/backend — these are flagged in-app rather than faked. Vault `withdraw` and a `cUSDC` ERC-7984 token are deferred (async-decrypt / cross-contract encrypted mint). Bridge / fiat off-ramp / guardian recovery are out of scope.

*Built for the Akindo WaveHack — Fhenix CoFHE & Nous Research ecosystems.*
