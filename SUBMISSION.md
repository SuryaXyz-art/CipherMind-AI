# 🧠 CipherMind — WaveHack Submission

> **A confidential-finance suite on Fhenix CoFHE: move money, get paid, borrow, and get AI analytics — with the numbers sealed shut.** Live on Arbitrum Sepolia.

---

## 1. The problem

Public chains make every amount visible: your balance, your salary, your debt, your credit profile. That kills real financial use cases — payroll, lending, payments, credit — because nobody wants their numbers on a public explorer. CipherMind keeps the *amounts* encrypted end-to-end while staying fully on-chain and trustless.

## 2. What it is

One app, several confidential surfaces, all built on **Fully Homomorphic Encryption** (Fhenix CoFHE) so the contract computes on ciphertext and only the owner can unseal results:

| Surface | What stays encrypted | The FHE move |
|---------|----------------------|--------------|
| **Payments** (vault) | Balance + transfer amount | `euint32` balances; send adjusts both sides homomorphically; overdraft → `FHE.select` moves 0 (no revert/leak) |
| **Payroll** | Every employee's salary | Per-recipient ACL; claim accumulates an encrypted salary balance |
| **Lending** | Collateral, debt, drawn, health | 75% LTV checked with `FHE.lte` on ciphertext; over-borrow clamps to 0; encrypted health boolean |
| **Credit scoring** | Income/debt/history → score | Oracle decrypts via permit → anonymized bands → Nous Hermes → encrypted score |
| **Trading signals** | Position/stops → signal | Same encrypted-oracle pattern; encrypted direction/strength/risk |
| **Research** | — | Multi-step Hermes agent (tool-calling) |

**Confidential primitives reused across surfaces:** balance/threshold **proofs** (prove "≥ X" without revealing the number), **benchmarking** (above-average without exposing scores), **selective disclosure** (grant exactly one viewer decrypt rights).

## 3. Why FHE (not just ZK)

These surfaces need the protocol to *compute* on private values — add balances, compare debt to an LTV, accumulate salaries, score a profile. ZK proves a statement; FHE lets the contract do the arithmetic and comparisons directly on ciphertext, which is exactly what payments/lending/payroll require.

## 4. Architecture

- **Contracts** (Solidity 0.8.25, `@fhenixprotocol/cofhe-contracts`): `EncryptedVault`, `ConfidentialPayroll`, `ConfidentialLending`, `CipherMindCredit`, `CipherMindTrading`, `MockUSDC`.
- **Off-chain oracle** (`backend/oracleLogic.ts`, run as `npx hardhat oracle`): for the AI surfaces — decrypts via its CoFHE permit, anonymizes to bands, calls Nous Hermes (dependency-free `fetch`), re-encrypts, fulfills.
- **Frontend** (Vite + React 19 + TS): `@cofhe/sdk/web` encrypts inputs and unseals results in the browser; single **surfaces-grid** UI with the ████ sealed-amount motif and a manual **dark/light** toggle.
- **AI:** Nous `hermes-4-70b` (native inference API).

## 5. Status — verified, not vaporware

- ✅ **51 tests passing** on the CoFHE mocks (every surface + every confidential primitive).
- ✅ **Live on Arbitrum Sepolia** — `npx hardhat e2e --network arb-sepolia` runs a full encrypted credit flow on-chain with a real Hermes call.
- ✅ Frontend type-checks + builds (bundles the CoFHE `tfhe` WASM runtime).

### Deployed contracts (Arbitrum Sepolia)
| Contract | Address |
|----------|---------|
| MockUSDC | `0xD634Ba983dE5cB66a65eBb113e4aBA36663af75E` |
| EncryptedVault | `0x1FEE1713517C0d33c01E63D3Af8ed4789a3eA1E6` |
| ConfidentialPayroll | `0x776B7Bc2086b75ce0603d402C2f1c0655c0A26C7` |
| ConfidentialLending | `0x897A2406C9b2FB897bEBb9Bc7c728b303300F1D4` |
| CipherMindCredit | `0x1128E66806605bCEf7836147C60a222CDa47cA53` |
| CipherMindTrading | `0x6f281299127c72BF4fF5A4B16408CE615200aD7E` |

## 6. Demo script (~2 min)

> Connect MetaMask (auto-switches to Arbitrum Sepolia). Tip: use a *second* account as the recipient so privacy across parties is visible.

1. **Payments** → *Deposit* 100 → balance shows `████`, click *Unseal* → 100. *Private Send* 30 to another address → amount is ciphertext on-chain; sender balance drops, recipient's rises (only they can read it).
2. **Balance Proof** → "Balance ≥ 50" → ✅ verified, exact balance never revealed.
3. **Payroll** → *Create run* → set two very different encrypted salaries for two addresses → each employee *Claims* and unseals **only their own** number.
4. **Lending** → *Deposit* 1000 collateral → *Borrow* 700 (ok) → *Borrow* 100 more → debt unchanged (over-75% LTV silently draws 0) → *Check health* → ✅ encrypted boolean.
5. **Credit** (needs `npm run oracle` running) → enter income/debt → encrypt → oracle → Hermes → unseal score.
6. **Research** → ask a question → watch the agent call a tool, then answer.

## 7. Run it

```bash
npm install && npx hardhat test            # 51 passing on mocks
npx hardhat deploy-vault            --network arb-sepolia
npx hardhat deploy-payroll-lending  --network arb-sepolia
npx hardhat deploy-credit           --network arb-sepolia
npx hardhat deploy-trading          --network arb-sepolia
#   → paste addresses into .env (root) and frontend/.env
npm run oracle                             # for credit/trading (keep open)
cd frontend && npm install && npm run dev
```

## 8. Credits / inspiration

Payments, payroll, and lending designs were informed by excellent confidential-finance work in the Fhenix ecosystem (gift-card checkout, confidential payroll, and confidential lending projects). All contracts here are **original implementations on CoFHE** — the ideas were studied, the code was written from scratch.

## 9. Honest scope

`withdraw` from the vault and a `cUSDC` ERC‑7984-style token are intentionally deferred (the former needs CoFHE async-decrypt to settle safely; the latter needs cross-contract encrypted minting). Bridge / fiat off-ramp / guardian recovery are out of scope — they require relayers / fiat operators / full account abstraction that can't be demonstrated trustlessly in a hackathon.

*Built for the Akindo WaveHack — Fhenix CoFHE & Nous Research ecosystems.*
