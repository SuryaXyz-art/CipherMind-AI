/**
 * CipherMind AI — Trading Signal Module
 *
 * Interfaces with Nous Hermes AI (via OpenRouter or self-hosted) to generate
 * trading signals from anonymized position parameters. The oracle never
 * reveals exact user positions — only relative risk/reward characteristics.
 */

import { nousChat } from "./nousClient";

// ── Types ────────────────────────────────────────────────────────────────

export interface AnonymizedTradingFeatures {
  positionSizeBand: string;   // e.g., "micro", "small", "medium", "large"
  riskRewardRatio: string;    // e.g., "poor", "fair", "good", "excellent"
  stopLossPercent: string;    // e.g., "tight", "moderate", "wide"
  riskToleranceBand: string;  // e.g., "conservative", "moderate", "aggressive"
  asset: string;              // Public: e.g., "ETH", "BTC"
}

export interface TradingSignalResult {
  direction: number;          // 0=HOLD, 1=BUY, 2=SELL
  strength: number;           // 0-100
  riskLevel: number;          // 0-100
  suggestedEntryAdjustment: number;  // Percentage adjustment from current entry
  reasoning: string;
}

// ── Band Mapping ─────────────────────────────────────────────────────────

export function anonymizeTradingFeatures(
  positionSize: number,
  entryPrice: number,
  stopLoss: number,
  takeProfit: number,
  riskTolerance: number,
  asset: string,
): AnonymizedTradingFeatures {
  const positionSizeBand =
    positionSize < 500
      ? "micro"
      : positionSize < 5000
        ? "small"
        : positionSize < 25000
          ? "medium"
          : "large";

  // Calculate risk/reward ratio
  const risk = Math.abs(entryPrice - stopLoss);
  const reward = Math.abs(takeProfit - entryPrice);
  const rrRatio = risk > 0 ? reward / risk : 0;

  const riskRewardRatio =
    rrRatio < 1
      ? "poor"
      : rrRatio < 2
        ? "fair"
        : rrRatio < 3
          ? "good"
          : "excellent";

  // Stop loss as percentage of entry
  const slPercent = (risk / entryPrice) * 100;
  const stopLossPercent =
    slPercent < 2
      ? "tight"
      : slPercent < 5
        ? "moderate"
        : "wide";

  const riskToleranceBand =
    riskTolerance <= 3
      ? "conservative"
      : riskTolerance <= 7
        ? "moderate"
        : "aggressive";

  return {
    positionSizeBand,
    riskRewardRatio,
    stopLossPercent,
    riskToleranceBand,
    asset,
  };
}

// ── AI Inference ─────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are CipherMind Trading Analyst, a privacy-preserving AI trading signal engine.

You receive ANONYMIZED position characteristics (not exact numbers) and an asset symbol.
Based on these, generate a trading signal.

RULES:
1. Direction: 0=HOLD, 1=BUY, 2=SELL
2. Strength: 0-100 (how confident is the signal)
3. Risk Level: 0-100 (how risky is the trade)
4. Suggested Entry Adjustment: -10 to +10 (percentage adjustment from user's entry)
5. Consider the risk/reward ratio heavily.
6. Conservative risk tolerance => lower-risk signals.
7. Poor risk/reward => HOLD or suggest adjustments.
8. Be conservative for "micro" and "small" positions.

Respond in STRICT JSON format:
{"direction": <number>, "strength": <number>, "riskLevel": <number>, "suggestedEntryAdjustment": <number>, "reasoning": "<string>"}`;

export async function generateTradingSignal(
  features: AnonymizedTradingFeatures,
): Promise<TradingSignalResult> {
  const userMessage = `Analyze this anonymized trading position:
- Asset: ${features.asset}
- Position Size Band: ${features.positionSizeBand}
- Risk/Reward Ratio: ${features.riskRewardRatio}
- Stop Loss Distance: ${features.stopLossPercent}
- Risk Tolerance: ${features.riskToleranceBand}

Provide a trading signal with direction, strength, risk level, and entry adjustment.`;

  try {
    const response = await nousChat(SYSTEM_PROMPT, userMessage, {
      temperature: 0.4,
      maxTokens: 400,
      json: true,
    });

    const parsed = JSON.parse(response) as TradingSignalResult;

    // Clamp values
    parsed.direction = Math.max(0, Math.min(2, Math.round(parsed.direction)));
    parsed.strength = Math.max(0, Math.min(100, Math.round(parsed.strength)));
    parsed.riskLevel = Math.max(0, Math.min(100, Math.round(parsed.riskLevel)));
    parsed.suggestedEntryAdjustment = Math.max(
      -10,
      Math.min(10, parsed.suggestedEntryAdjustment),
    );

    const dirLabels = ["HOLD", "BUY", "SELL"];
    console.log(
      `📊 Trading Signal: ${dirLabels[parsed.direction]} (strength: ${parsed.strength}%, risk: ${parsed.riskLevel}%)`,
    );
    console.log(`   Reasoning: ${parsed.reasoning}`);

    return parsed;
  } catch (error) {
    console.error("❌ Nous Hermes AI Error:", error);
    return fallbackTradingSignal(features);
  }
}

/**
 * Deterministic fallback when AI is unavailable.
 */
function fallbackTradingSignal(
  features: AnonymizedTradingFeatures,
): TradingSignalResult {
  // Conservative: default to HOLD with moderate strength
  let direction = 0; // HOLD
  let strength = 40;
  let riskLevel = 50;

  if (features.riskRewardRatio === "excellent" || features.riskRewardRatio === "good") {
    direction = 1; // BUY
    strength = 55;
    riskLevel = 35;
  }

  if (features.riskRewardRatio === "poor") {
    direction = 0; // HOLD
    strength = 70;
    riskLevel = 70;
  }

  if (features.riskToleranceBand === "conservative") {
    riskLevel = Math.min(riskLevel + 15, 100);
    strength = Math.max(strength - 10, 10);
  }

  console.log(
    `⚠️  Fallback Trading Signal: ${["HOLD", "BUY", "SELL"][direction]} (strength: ${strength}%, risk: ${riskLevel}%)`,
  );

  return {
    direction,
    strength,
    riskLevel,
    suggestedEntryAdjustment: 0,
    reasoning: "Fallback deterministic signal — AI unavailable",
  };
}
