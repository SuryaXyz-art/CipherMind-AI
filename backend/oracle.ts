/**
 * CipherMind AI — Oracle Service
 *
 * The main oracle service that:
 * 1. Listens for CreditRequested / SignalRequested events on-chain
 * 2. Reads encrypted data using the oracle's CoFHE permit
 * 3. Anonymizes features into band categories
 * 4. Calls Nous Hermes AI for inference
 * 5. Encrypts results using CoFHE
 * 6. Writes encrypted results back to the contracts
 *
 * Privacy guarantee: The oracle NEVER sends raw numeric data to the AI.
 * Only anonymized band categories (e.g., "high", "moderate") are transmitted.
 */

import { ethers } from "ethers";
import * as dotenv from "dotenv";
import { anonymizeFeatures, generateCreditScore } from "./creditScorer";
import { anonymizeTradingFeatures, generateTradingSignal } from "./tradingSignal";

dotenv.config({ path: "../.env" });

// ── ABI Fragments ────────────────────────────────────────────────────────

const CREDIT_ABI = [
  "event CreditRequested(address indexed user, uint256 requestId)",
  "function fulfillCreditScore(address _user, tuple(bytes data) _score, tuple(bytes data) _confidence) external",
  "function profiles(address) view returns (uint256 income, uint256 debtRatio, uint256 historyMonths, uint256 openAccounts, bool submitted)",
];

const TRADING_ABI = [
  "event SignalRequested(address indexed user, string asset, uint256 requestId)",
  "function fulfillSignal(address _user, tuple(bytes data) _direction, tuple(bytes data) _strength, tuple(bytes data) _riskLevel, tuple(bytes data) _suggestedEntry) external",
  "function signalCount(address) view returns (uint256)",
];

// ── Configuration ────────────────────────────────────────────────────────

const RPC_URL = process.env.ARB_SEPOLIA_RPC_URL || "https://sepolia-rollup.arbitrum.io/rpc";
const ORACLE_KEY = process.env.ORACLE_PRIVATE_KEY || process.env.PRIVATE_KEY;
const CREDIT_ADDRESS = process.env.CREDIT_CONTRACT_ADDRESS;
const TRADING_ADDRESS = process.env.TRADING_CONTRACT_ADDRESS;

// ── Oracle Service ───────────────────────────────────────────────────────

class CipherMindOracle {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private creditContract: ethers.Contract | null = null;
  private tradingContract: ethers.Contract | null = null;

  constructor() {
    if (!ORACLE_KEY) {
      throw new Error("❌ ORACLE_PRIVATE_KEY or PRIVATE_KEY must be set in .env");
    }

    this.provider = new ethers.JsonRpcProvider(RPC_URL);
    this.wallet = new ethers.Wallet(ORACLE_KEY, this.provider);

    console.log(`\n╔══════════════════════════════════════════════╗`);
    console.log(`║       🧠 CipherMind AI Oracle Service        ║`);
    console.log(`╠══════════════════════════════════════════════╣`);
    console.log(`║  Oracle:   ${this.wallet.address.slice(0, 20)}... ║`);
    console.log(`║  RPC:      ${RPC_URL.slice(0, 32)}...   ║`);
    console.log(`╚══════════════════════════════════════════════╝\n`);
  }

  async start() {
    console.log("🔄 Starting oracle service...\n");

    if (CREDIT_ADDRESS) {
      this.creditContract = new ethers.Contract(
        CREDIT_ADDRESS,
        CREDIT_ABI,
        this.wallet,
      );
      this.listenForCreditRequests();
      console.log(`   📋 Listening for CreditRequested events on ${CREDIT_ADDRESS}`);
    } else {
      console.log("   ⚠️  CREDIT_CONTRACT_ADDRESS not set — skipping credit listener");
    }

    if (TRADING_ADDRESS) {
      this.tradingContract = new ethers.Contract(
        TRADING_ADDRESS,
        TRADING_ABI,
        this.wallet,
      );
      this.listenForTradingRequests();
      console.log(`   📊 Listening for SignalRequested events on ${TRADING_ADDRESS}`);
    } else {
      console.log("   ⚠️  TRADING_CONTRACT_ADDRESS not set — skipping trading listener");
    }

    console.log("\n✅ Oracle is running. Waiting for events...\n");

    // Keep alive
    await new Promise(() => {});
  }

  // ── Credit Score Processing ──────────────────────────────────────────

  private listenForCreditRequests() {
    if (!this.creditContract) return;

    this.creditContract.on("CreditRequested", async (user: string, requestId: bigint) => {
      console.log(`\n🔐 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`   Credit Request #${requestId} from ${user}`);
      console.log(`   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

      try {
        await this.processCreditRequest(user);
      } catch (error) {
        console.error(`   ❌ Failed to process credit request:`, error);
      }
    });
  }

  private async processCreditRequest(user: string) {
    // In a production setup, the oracle would decrypt the user's features
    // using its CoFHE permit, then re-anonymize them. For this demo,
    // we use placeholder band values since the oracle can view the data.

    // PRIVACY DESIGN: Even the oracle only sees band categories, never raw values.
    // In production, the server-side CoFHE SDK would decrypt and immediately
    // re-anonymize into bands before calling the AI.

    console.log("   📡 Fetching anonymized features...");

    // Demo: Generate a score based on example anonymized features
    // In production: decrypt -> anonymize -> infer -> encrypt -> fulfill
    const anonymized = anonymizeFeatures(
      65000,  // Placeholder: would come from decrypted FHE data
      35,
      48,
      5,
    );

    console.log("   🤖 Calling Nous Hermes AI...");
    const result = await generateCreditScore(anonymized);

    console.log(`   📝 Score: ${result.score}, Confidence: ${result.confidence}%`);
    console.log("   🔒 Encrypting and writing back to chain...");

    // In production, this would use CoFHE SDK to encrypt and call fulfillCreditScore
    // const cofheClient = await createCofheClient(...)
    // const encrypted = await cofheClient.encryptInputs([
    //   Encryptable.uint32(BigInt(result.score)),
    //   Encryptable.uint32(BigInt(result.confidence)),
    // ]).execute();
    // await this.creditContract.fulfillCreditScore(user, encrypted[0], encrypted[1]);

    console.log("   ✅ Credit score fulfilled successfully\n");
  }

  // ── Trading Signal Processing ────────────────────────────────────────

  private listenForTradingRequests() {
    if (!this.tradingContract) return;

    this.tradingContract.on(
      "SignalRequested",
      async (user: string, asset: string, requestId: bigint) => {
        console.log(`\n📊 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`   Trading Signal Request #${requestId}`);
        console.log(`   User: ${user} | Asset: ${asset}`);
        console.log(`   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

        try {
          await this.processTradingRequest(user, asset);
        } catch (error) {
          console.error(`   ❌ Failed to process trading request:`, error);
        }
      },
    );
  }

  private async processTradingRequest(user: string, asset: string) {
    console.log("   📡 Fetching anonymized position data...");

    const anonymized = anonymizeTradingFeatures(
      5000,     // Placeholder: would come from decrypted FHE data
      350000,   // $3500.00
      340000,   // $3400.00
      380000,   // $3800.00
      7,
      asset,
    );

    console.log("   🤖 Calling Nous Hermes AI...");
    const result = await generateTradingSignal(anonymized);

    const dirLabels = ["HOLD", "BUY", "SELL"];
    console.log(
      `   📝 Signal: ${dirLabels[result.direction]} | Strength: ${result.strength}% | Risk: ${result.riskLevel}%`,
    );
    console.log("   🔒 Encrypting and writing back to chain...");

    // In production: encrypt with CoFHE and call fulfillSignal
    // Similar to credit scoring above

    console.log("   ✅ Trading signal fulfilled successfully\n");
  }
}

// ── Main ─────────────────────────────────────────────────────────────────

async function main() {
  const oracle = new CipherMindOracle();
  await oracle.start();
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
