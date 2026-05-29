/**
 * CipherMind — Autonomous Actions engine.
 *
 * Hermes proposes concrete portfolio actions toward a goal; every action is
 * simulated/previewed and must clear a safety harness (human-approval mode,
 * per-action spending limit, global emergency stop, risk threshold) before any
 * execution. Approved `send` actions route through the EXISTING encrypted vault
 * — nothing here changes existing vault logic.
 */

import { encryptUint32s } from "./cofhe";
import { getVaultContract } from "./contracts";

export interface ProposedAction {
  id: string;
  type: "send" | "deposit" | "hold";
  amount: number; // whole USDC
  rationale: string;
  risk: number; // 0-100
}

export interface Safety {
  approvalMode: boolean;   // require explicit human approval before execute
  spendingLimit: number;   // max whole-USDC per action
  emergencyStop: boolean;  // global kill switch
  riskThreshold: number;   // block actions above this risk
}

export const DEFAULT_SAFETY: Safety = { approvalMode: true, spendingLimit: 50, emergencyStop: false, riskThreshold: 60 };

const NOUS_KEY = import.meta.env.VITE_NOUS_API_KEY as string | undefined;
const NOUS_URL = ((import.meta.env.VITE_NOUS_API_BASE_URL as string) || "https://inference-api.nousresearch.com/v1").replace(/\/$/, "");
const NOUS_MODEL = (import.meta.env.VITE_NOUS_MODEL as string) || "nousresearch/hermes-4-70b";

let counter = 0;

export async function proposeActions(goal: string, context: string): Promise<{ summary: string; actions: ProposedAction[] }> {
  const system =
    "You are CipherMind's autonomous strategy agent. Propose 2-4 concrete actions toward the user's goal, sized conservatively in whole USDC. " +
    'Each action: type ("send"|"deposit"|"hold"), amount (whole USDC, 0 for hold), risk (0-100), one-line rationale. ' +
    'Return STRICT JSON: {"summary":"<one line>","actions":[{"type":"...","amount":<n>,"risk":<n>,"rationale":"..."}]}.';
  try {
    const res = await fetch(`${NOUS_URL}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(NOUS_KEY ? { Authorization: `Bearer ${NOUS_KEY}` } : {}) },
      body: JSON.stringify({
        model: NOUS_MODEL,
        messages: [
          { role: "system", content: system },
          { role: "user", content: `Goal: ${goal}\nContext: ${context || "(none)"}` },
        ],
        temperature: 0.4, max_tokens: 500, response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) throw new Error(`Nous HTTP ${res.status}`);
    const data = await res.json();
    const parsed = JSON.parse(data?.choices?.[0]?.message?.content ?? "{}");
    const actions: ProposedAction[] = (parsed.actions || []).slice(0, 4).map((a: any) => ({
      id: `a${counter++}`,
      type: (["send", "deposit", "hold"].includes(a.type) ? a.type : "hold") as ProposedAction["type"],
      amount: Math.max(0, Math.round(Number(a.amount) || 0)),
      rationale: String(a.rationale || ""),
      risk: Math.max(0, Math.min(100, Math.round(Number(a.risk) || 50))),
    }));
    return { summary: String(parsed.summary || ""), actions };
  } catch (e: any) {
    throw new Error(e?.message || "Planning failed");
  }
}

export interface SafetyCheck { allowed: boolean; reasons: string[] }

export function checkSafety(a: ProposedAction, s: Safety): SafetyCheck {
  const reasons: string[] = [];
  if (s.emergencyStop) reasons.push("Emergency stop is ON — all execution blocked.");
  if (a.type === "hold") reasons.push("Hold — nothing to execute.");
  if (a.amount > s.spendingLimit) reasons.push(`Amount ${a.amount} exceeds spending limit ${s.spendingLimit}.`);
  if (a.risk > s.riskThreshold) reasons.push(`Risk ${a.risk} exceeds threshold ${s.riskThreshold}.`);
  return { allowed: reasons.length === 0, reasons };
}

/** Execute an approved `send` action via the existing encrypted vault. */
export async function executeSend(to: string, amount: number): Promise<void> {
  const vault = await getVaultContract();
  const enc = await encryptUint32s([Math.round(amount)]);
  await (await vault.send(to, enc[0])).wait();
}
