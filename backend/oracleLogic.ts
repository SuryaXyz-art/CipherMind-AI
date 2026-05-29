/**
 * CipherMind AI — Oracle core logic (testable)
 *
 * The real privacy loop, decoupled from any specific runtime so it can be
 * exercised by Hardhat tests on the CoFHE mocks *and* run live against
 * Arbitrum Sepolia from the `oracle` Hardhat task.
 *
 *   1. Read the user's encrypted feature handles from the contract.
 *   2. Decrypt them off-chain using the oracle's CoFHE permit (sealed view).
 *   3. Anonymize raw numbers into coarse bands — the AI never sees exact values.
 *   4. Ask Nous Hermes for a score / signal (deterministic fallback otherwise).
 *   5. Re-encrypt the result with CoFHE and write it back on-chain.
 *
 * Privacy guarantee: only the oracle (granted via FHE.allow at submit time)
 * can briefly view the raw values, and it immediately collapses them to bands
 * before any data leaves the process.
 */

import { Encryptable, FheTypes } from "@cofhe/sdk";
import {
  anonymizeFeatures,
  generateCreditScore,
  type CreditScoreResult,
} from "./creditScorer";
import {
  anonymizeTradingFeatures,
  generateTradingSignal,
  type TradingSignalResult,
} from "./tradingSignal";

// The CoFHE client is structurally complex; we only need encrypt + view-decrypt.
type CofheClient = any;
// An ethers Contract instance with the CipherMind methods.
type Contract = any;

/** Decrypt a single euint32 handle the oracle has been granted access to. */
async function viewUint32(client: CofheClient, ctHash: bigint | string): Promise<number> {
  const value: bigint = await client
    .decryptForView(ctHash, FheTypes.Uint32)
    .withPermit()
    .execute();
  return Number(value);
}

// ── Credit ─────────────────────────────────────────────────────────────────

export interface CreditFulfillment {
  raw: { income: number; debtRatio: number; historyMonths: number; openAccounts: number };
  result: CreditScoreResult;
}

/**
 * Process one credit request end-to-end and write the encrypted score back.
 * @param infer  Inference function (defaults to live Nous Hermes call with
 *               built-in deterministic fallback). Injected in tests.
 */
export async function fulfillCreditRequest(
  client: CofheClient,
  creditContract: Contract,
  user: string,
  infer: (f: ReturnType<typeof anonymizeFeatures>) => Promise<CreditScoreResult> = generateCreditScore,
): Promise<CreditFulfillment> {
  // 1. Read encrypted handles from the contract.
  const profile = await creditContract.profiles(user);

  // 2. Decrypt off-chain via the oracle's permit.
  const income = await viewUint32(client, profile.income);
  const debtRatio = await viewUint32(client, profile.debtRatio);
  const historyMonths = await viewUint32(client, profile.historyMonths);
  const openAccounts = await viewUint32(client, profile.openAccounts);

  // 3. Anonymize into bands (privacy boundary — raw values stop here).
  const bands = anonymizeFeatures(income, debtRatio, historyMonths, openAccounts);

  // 4. AI inference on bands only.
  const result = await infer(bands);

  // 5. Re-encrypt and fulfill on-chain.
  const encrypted = await client
    .encryptInputs([
      Encryptable.uint32(BigInt(result.score)),
      Encryptable.uint32(BigInt(result.confidence)),
    ])
    .execute();

  await creditContract.fulfillCreditScore(user, encrypted[0], encrypted[1]);

  return { raw: { income, debtRatio, historyMonths, openAccounts }, result };
}

// ── Trading ──────────────────────────────────────────────────────────────────

export interface TradingFulfillment {
  result: TradingSignalResult;
}

/**
 * Process one trading-signal request end-to-end for the user's latest position.
 */
export async function fulfillTradingRequest(
  client: CofheClient,
  tradingContract: Contract,
  user: string,
  asset: string,
  infer: (f: ReturnType<typeof anonymizeTradingFeatures>) => Promise<TradingSignalResult> = generateTradingSignal,
): Promise<TradingFulfillment> {
  // Latest position is the last entry in the user's history array.
  const count: bigint = await tradingContract.getPositionCount(user);
  const idx = Number(count) - 1;
  if (idx < 0) throw new Error("No position submitted for user");

  const pos = await tradingContract.positionHistory(user, idx);

  const positionSize = await viewUint32(client, pos.positionSize);
  const entryPrice = await viewUint32(client, pos.entryPrice);
  const stopLoss = await viewUint32(client, pos.stopLoss);
  const takeProfit = await viewUint32(client, pos.takeProfit);
  const riskTolerance = await viewUint32(client, pos.riskTolerance);

  const bands = anonymizeTradingFeatures(
    positionSize,
    entryPrice,
    stopLoss,
    takeProfit,
    riskTolerance,
    asset,
  );

  const result = await infer(bands);

  // suggestedEntry on-chain is an absolute price ×100, adjusted from entry.
  const suggestedEntry = Math.max(
    0,
    Math.round(entryPrice * (1 + result.suggestedEntryAdjustment / 100)),
  );

  const encrypted = await client
    .encryptInputs([
      Encryptable.uint32(BigInt(result.direction)),
      Encryptable.uint32(BigInt(result.strength)),
      Encryptable.uint32(BigInt(result.riskLevel)),
      Encryptable.uint32(BigInt(suggestedEntry)),
    ])
    .execute();

  await tradingContract.fulfillSignal(
    user,
    encrypted[0],
    encrypted[1],
    encrypted[2],
    encrypted[3],
  );

  return { result };
}
