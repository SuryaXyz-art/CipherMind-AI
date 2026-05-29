# 🧠 CipherMind AI — WaveHack Submission

> **Privacy-first AI intelligence on encrypted data — Fhenix CoFHE × Nous Hermes, live on Arbitrum Sepolia.**

---

## 1. The problem

Every "AI for finance" product asks you to hand over your rawest data — income, debt, positions, trading strategy — to a model and a server you don't control. Credit scoring, trading signals, and research all leak the exact numbers that define your financial life.

**CipherMind removes that trade-off.** Your numbers are encrypted on your device, processed as ciphertext on-chain, and the AI only ever sees *anonymized bands* — never a raw value. The result comes back encrypted, and only you can unseal it.

## 2. The solution

A full FHE + LLM pipeline where the privacy guarantee is enforced by code, not policy:

```
Browser (you)                Arbitrum Sepolia (CoFHE)            Off-chain oracle            Nous Hermes
─────────────                ────────────────────────            ─────────────────            ───────────
encrypt income/position  ─▶  store euint32 ciphertext
(@cofhe/sdk/web)              FHE.allow(oracle)            ─▶     decrypt via permit
                                                                 anonymize → bands      ─▶    score / signal
                              store euint32 result         ◀─     encrypt result        ◀─    (reasoning)
unseal with your permit  ◀─   FHE.allow(you)
```

The oracle is the *only* party granted decrypt rights (`FHE.allow(field, oracle)` at submit time), and it collapses raw values into coarse bands (`"high"`, `"moderate"`, …) before the LLM is ever called. Raw numbers never leave the encrypted/oracle boundary.

## 3. What's novel (and genuinely FHE-native)

Beyond the core scoring flow, CipherMind ships **six confidential features** that are only possible with FHE — each returns an *encrypted* answer that only the user can unseal:

| Feature | Contract call | Why it needs FHE |
|---------|--------------|------------------|
| **Credit scoring** | `submitProfile` → oracle → unseal | Score computed without exposing income/debt |
| **Trading signals** | `submitPosition` → oracle → unseal | Signal without exposing positions/stops |
| **Confidential benchmarking** | `requestBenchmarkComparison` / `requestStrengthBenchmark` | "Am I above the network average?" via `score × count > Σ` (avoids FHE division) — **no individual score or the average is ever revealed** |
| **Encrypted threshold alerts** | `evaluateScoreThreshold` / `evaluateRiskThreshold` | "Is my score ≥ X / risk ≥ X?" returns an encrypted boolean; **the threshold X stays private too** |
| **Selective-disclosure passport** | `grantScoreAccess` / `grantSignalAccess` | Grant exactly one lender/fund the right to unseal — composable by other contracts |
| **Hermes agentic research** | client-side ReAct loop | Multi-step tool-calling agent (price lookup, concept explainer) before answering |

## 4. Architecture

- **Smart contracts** (Solidity `0.8.25`, `@fhenixprotocol/cofhe-contracts`): `CipherMindCredit`, `CipherMindTrading`, `CipherMindAnalytics`. All state is `euint32`/`ebool`; the 3-step public reveal and sealed `decryptForView` flows are both supported.
- **Off-chain oracle** (`backend/oracleLogic.ts`, run as `npx hardhat oracle`): listens for events, decrypts via its CoFHE permit, anonymizes, calls Nous Hermes (`backend/nousClient.ts`, dependency-free `fetch`), re-encrypts, fulfills. Reuses one CoFHE client that works on mocks *and* live networks.
- **Frontend** (Vite + React 19 + TS): `@cofhe/sdk/web` in the browser encrypts inputs and unseals results; `ethers` drives the contracts; the Hermes agent runs client-side.
- **AI**: Nous `hermes-4-70b` via the native inference API.

## 5. Status — verified, not vaporware

- ✅ **39/39 tests pass** on the CoFHE mocks (contracts, real oracle loop, all 6 confidential features, agentic loop).
- ✅ **Live on Arbitrum Sepolia** — `npx hardhat e2e --network arb-sepolia` runs the full encrypted credit flow on-chain with a real Hermes call.
- ✅ Frontend type-checks and builds (bundles the CoFHE `tfhe` WASM runtime).

**Deployed contracts (Arbitrum Sepolia):**
- CipherMindCredit — `0x1128E66806605bCEf7836147C60a222CDa47cA53`
- CipherMindTrading — `0x6f281299127c72BF4fF5A4B16408CE615200aD7E`

## 6. Wave / milestone map

- **Wave 1 — Real core:** end-to-end encrypted credit + trading flow (encrypt → submit → oracle → Hermes → unseal), keystone `FHE.allow(oracle)` fix, deployed + verified on Arbitrum Sepolia.
- **Wave 2 — Confidential analytics:** benchmarking, threshold alerts, and selective-disclosure passport on both credit and trading — encrypted comparisons and ACL-based sharing.
- **Wave 3 — Agentic intelligence:** multi-step tool-calling Hermes research agent; deeper Nous integration.
- **Future:** on-chain composability (other contracts consuming a confidential score), encrypted portfolio analytics, multi-asset signals.

## 7. Demo script (2 min)

1. Connect MetaMask (auto-switches to Arbitrum Sepolia). *Use a second account as the "user" to show it differs from the oracle.*
2. **Credit:** enter income/debt/history → watch encrypt → submit → oracle → unseal. Show the score appears, but the raw inputs were never exposed.
3. **Confidential actions:** click *Compare (encrypted)* → "above average" with no scores revealed; *Check threshold* → encrypted yes/no; *Grant access* to a lender address.
4. **Trading:** generate a signal, then the same three confidential actions on it.
5. **Research:** ask "What's the price of BTC and is yield farming risky?" → watch the agent call tools then answer.

## 8. Run it

See [`README.md`](./README.md) for full setup. Quick path:
```bash
npm install && npx hardhat test           # 39 passing on mocks
npx hardhat deploy-credit  --network arb-sepolia
npx hardhat deploy-trading --network arb-sepolia
npm run oracle                            # keep running
cd frontend && npm install && npm run dev
```

*Built for the Akindo WaveHack — Fhenix CoFHE & Nous Research ecosystems.*
