# 🧠 CipherMind AI

> **Privacy-First AI Intelligence Powered by Fhenix CoFHE & Nous Hermes AI**

CipherMind AI is an advanced, privacy-preserving AI analytics platform that delivers institutional-grade financial intelligence—such as credit scoring, trading signals, and deep market research—without ever exposing your raw data.

By combining the cryptographic guarantees of **Fully Homomorphic Encryption (FHE)** via the Fhenix protocol with the reasoning capabilities of **Nous Hermes AI**, CipherMind ensures that your numbers stay encrypted. Always.

---

## ✨ Features

- **🛡️ 100% Zero-Knowledge Privacy:** Your data never leaves your device unencrypted. All processing occurs on ciphertext.
- **📊 FHE Credit Scoring:** Calculate AI-powered credit scores dynamically based on your income and history, completely anonymously.
- **📈 Trading Signal Generator:** Generate Buy/Sell/Hold signals with confidence levels derived from your private portfolio data.
- **🔍 Encrypted Research AI:** Ask questions directly to Nous Hermes 4 (70B) over an encrypted channel. The queries are sealed, processed via off-chain oracle matching, and unsealed safely in your browser.
- **⚡ CoFHE Integration:** Employs Coprocessor FHE (CoFHE) to handle intense homomorphic computations effectively on Arbitrum Sepolia.

---

## 🏗️ Architecture Stack

1. **Frontend**: Vite + React 19 + TypeScript + Modern CSS
   - Provides smooth, client-side encryption of user inputs.
   - Decrypts off-chain oracle responses securely using the user's private key.
2. **Smart Contracts**: Solidity + Fhenix (`@fhenixprotocol/contracts`)
   - `CipherMindCredit.sol`: Handles encrypted credit limit and income data natively on-chain.
   - `CipherMindTrading.sol`: Handles encrypted positions and entry markers.
3. **Off-Chain Oracle (Backend)**: TypeScript + Node.js
   - Listens to FHE events on Arbitrum Sepolia.
   - Pipes the *anonymized general query* to the **Nous Research API** natively.
   - Re-encrypts the AI's JSON output back onto the chain.
4. **AI Inference**: Nous Research (Native Inference API)
   - Powered by `Hermes-4-70B`.

---

## 🚀 Getting Started

### 1. Requirements
- Node.js >= 18
- A Metamask / Web3 Wallet configured to **Arbitrum Sepolia Testnet**
- A native API key from [Nous Research Portal](https://portal.nousresearch.com)

### 2. Configure Environment

Rename `.env.example` to `.env` in the root folder, and fill in your keys:

```env
PRIVATE_KEY=your_wallet_private_key
NOUS_API_KEY=sk-cn... # Your native Nous Research Key
NOUS_API_BASE_URL=https://inference-api.nousresearch.com/v1
NOUS_MODEL=nousresearch/hermes-4-70b
```

Inside the `frontend/` folder, create another `.env` file for Vite:

```env
VITE_NOUS_API_KEY=your_nous_key
VITE_NOUS_API_BASE_URL=https://inference-api.nousresearch.com/v1
VITE_NOUS_MODEL=nousresearch/hermes-4-70b
```

### 3. Installation, Deploy & Run

```bash
# 1. Install root (contracts / oracle / hardhat) deps
npm install

# 2. Run the test suite (CoFHE mocks — no testnet needed)
npx hardhat test          # 36 passing: contracts, real oracle loop, FHE features, agentic research

# 3. Deploy contracts to Arbitrum Sepolia
npx hardhat deploy-credit  --network arb-sepolia
npx hardhat deploy-trading --network arb-sepolia
#   → copy the printed addresses into .env (CREDIT_CONTRACT_ADDRESS / TRADING_CONTRACT_ADDRESS)
#     and into frontend/.env (VITE_CREDIT_ADDRESS / VITE_TRADING_ADDRESS)

# 4. Start the off-chain oracle (decrypt → anonymize → Nous Hermes → encrypt → fulfill)
npm run oracle             # = hardhat oracle --network arb-sepolia
#   For a fully local run instead: `npm run localcofhe:start` then `npm run oracle:local`

# 5. Run the frontend
cd frontend && npm install && npm run dev
```

Visit `http://localhost:5173`, connect MetaMask (it will prompt to add/switch to Arbitrum Sepolia), and use the dashboard.

> **How the real flow works:** the browser encrypts your inputs with CoFHE (`@cofhe/sdk/web`) and submits ciphertext on-chain. The oracle — the only party `FHE.allow`'d to read it — decrypts via its permit, anonymizes into bands, asks Nous Hermes, then writes an **encrypted** result back. Only you can unseal it.

### Confidential features (all on encrypted data)

- **Benchmarking** — `requestBenchmarkComparison()`: learn if you're above the encrypted network average without revealing any score (`score×count > Σ` to avoid FHE division).
- **Threshold alerts** — `evaluateScoreThreshold(InEuint32)`: "is my score ≥ X?" as an encrypted boolean; X stays private.
- **Selective disclosure** — `grantScoreAccess(viewer)`: grant exactly one lender/contract the right to unseal your score.
- **Hermes agentic research** — multi-step tool-calling agent (`backend/researchAgent.ts`, mirrored in the browser) that gathers facts before answering.

---

## 🔐 Security Notice
This is a demonstration of Homomorphic Encryption merged with LLMs. Please do not submit real Social Security Numbers or extremely sensitive real-life banking keys on testnets.

---
*Built for the Agentic Commerce Ecosystem & The CoFHE Infrastructure*
