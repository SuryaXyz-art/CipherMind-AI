/**
 * CipherMind AI — Credit Scorer Module
 *
 * Interfaces with Nous Hermes AI (via OpenRouter or self-hosted) to generate
 * credit scores from anonymized feature bands. Raw user data never leaves
 * the encrypted domain — the oracle only sends anonymized band categories.
 */

import { nousChat } from "./nousClient";

// ── Types ────────────────────────────────────────────────────────────────

export interface AnonymizedCreditFeatures {
  incomeBand: string;       // e.g., "low", "medium", "high", "very_high"
  debtRatioBand: string;    // e.g., "low", "moderate", "high", "critical"
  historyBand: string;      // e.g., "short", "medium", "long", "extensive"
  accountsBand: string;     // e.g., "few", "moderate", "many"
}

export interface CreditScoreResult {
  score: number;            // 300-850
  confidence: number;       // 0-100
  reasoning: string;        // AI reasoning (not stored on-chain)
}

// ── Band Mapping ─────────────────────────────────────────────────────────

/**
 * Maps raw numeric values to anonymized bands.
 * This is where privacy is enforced — the AI never sees exact numbers.
 */
export function anonymizeFeatures(
  income: number,
  debtRatio: number,
  historyMonths: number,
  openAccounts: number,
): AnonymizedCreditFeatures {
  const incomeBand =
    income < 30000
      ? "low"
      : income < 60000
        ? "medium"
        : income < 100000
          ? "high"
          : "very_high";

  const debtRatioBand =
    debtRatio < 20
      ? "low"
      : debtRatio < 40
        ? "moderate"
        : debtRatio < 60
          ? "high"
          : "critical";

  const historyBand =
    historyMonths < 12
      ? "short"
      : historyMonths < 36
        ? "medium"
        : historyMonths < 84
          ? "long"
          : "extensive";

  const accountsBand =
    openAccounts < 3
      ? "few"
      : openAccounts < 7
        ? "moderate"
        : "many";

  return { incomeBand, debtRatioBand, historyBand, accountsBand };
}

// ── AI Inference ─────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are CipherMind Credit Analyst, a privacy-preserving AI credit scoring engine.

You receive ANONYMIZED feature bands (not raw numbers) about a user's financial profile.
Based on these bands, generate a credit score and confidence level.

RULES:
1. Credit score MUST be between 300 and 850.
2. Confidence MUST be between 0 and 100 (percent).
3. Consider ALL features holistically.
4. Lower debt ratios and longer history improve scores.
5. Higher income bands improve scores.
6. More accounts (up to a point) indicate diverse credit experience.

Respond in STRICT JSON format:
{"score": <number>, "confidence": <number>, "reasoning": "<string>"}`;

export async function generateCreditScore(
  features: AnonymizedCreditFeatures,
): Promise<CreditScoreResult> {
  const userMessage = `Analyze this anonymized credit profile:
- Income Band: ${features.incomeBand}
- Debt-to-Income Ratio Band: ${features.debtRatioBand}
- Credit History Length Band: ${features.historyBand}
- Open Accounts Band: ${features.accountsBand}

Provide a credit score (300-850), confidence level (0-100), and brief reasoning.`;

  try {
    const response = await nousChat(SYSTEM_PROMPT, userMessage, {
      temperature: 0.3,
      maxTokens: 300,
      json: true,
    });

    const parsed = JSON.parse(response) as CreditScoreResult;

    // Clamp values to valid ranges
    parsed.score = Math.max(300, Math.min(850, Math.round(parsed.score)));
    parsed.confidence = Math.max(0, Math.min(100, Math.round(parsed.confidence)));

    console.log(
      `🔐 Credit Score Generated: ${parsed.score} (confidence: ${parsed.confidence}%)`,
    );
    console.log(`   Reasoning: ${parsed.reasoning}`);

    return parsed;
  } catch (error) {
    console.error("❌ Nous Hermes AI Error:", error);

    // Fallback deterministic scoring based on bands
    return fallbackCreditScore(features);
  }
}

/**
 * Deterministic fallback scoring when AI is unavailable.
 * Uses weighted band values.
 */
function fallbackCreditScore(
  features: AnonymizedCreditFeatures,
): CreditScoreResult {
  const bandScores: Record<string, number> = {
    // Income
    low: 0, medium: 1, high: 2, very_high: 3,
    // Debt
    critical: 0, // high: 1, moderate: 2, low: 3 (handled below)
    // History
    short: 0, // medium: 1, long: 2, extensive: 3
    // Accounts
    few: 0, // moderate: 1, many: 2
  };

  const incomeVal = { low: 0, medium: 1, high: 2, very_high: 3 }[features.incomeBand] ?? 1;
  const debtVal = { critical: 0, high: 1, moderate: 2, low: 3 }[features.debtRatioBand] ?? 1;
  const histVal = { short: 0, medium: 1, long: 2, extensive: 3 }[features.historyBand] ?? 1;
  const acctVal = { few: 0, moderate: 1, many: 2 }[features.accountsBand] ?? 1;

  // Weighted sum: income (30%), debt (30%), history (25%), accounts (15%)
  const rawScore =
    incomeVal * 0.3 + debtVal * 0.3 + histVal * 0.25 + acctVal * 0.15;
  const maxPossible = 3 * 0.3 + 3 * 0.3 + 3 * 0.25 + 2 * 0.15;

  const score = Math.round(300 + (rawScore / maxPossible) * 550);
  const confidence = 60; // Lower confidence for fallback

  console.log(`⚠️  Fallback Credit Score: ${score} (confidence: ${confidence}%)`);

  return {
    score,
    confidence,
    reasoning: "Fallback deterministic scoring — AI unavailable",
  };
}
