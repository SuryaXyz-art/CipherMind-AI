/**
 * CipherMind — Multi-Agent Hermes council.
 *
 * A council of specialized Hermes agents with an orchestration layer:
 *   planner → delegate to relevant agents → synthesize.
 * Agents share context, each returns a confidence score, and every step is
 * captured as a reasoning trace (verifiable AI reasoning). Runs client-side
 * over the existing Nous integration — purely additive, no new infrastructure.
 *
 * Privacy: queries travel a sealed channel and the council reasons over the
 * shared context; raw figures from the on-chain FHE surfaces never enter here.
 */

const API_KEY = import.meta.env.VITE_NOUS_API_KEY as string | undefined;
const BASE_URL = ((import.meta.env.VITE_NOUS_API_BASE_URL as string) || "https://inference-api.nousresearch.com/v1").replace(/\/$/, "");
const MODEL = (import.meta.env.VITE_NOUS_MODEL as string) || "nousresearch/hermes-4-70b";

export interface AgentDef {
  id: string;
  name: string;
  role: string;
  accent: string;
  system: string;
}

export const AGENTS: AgentDef[] = [
  {
    id: "research", name: "Research Agent", role: "Protocol & market research", accent: "#00d4ff",
    system: "You are the Research Agent. Investigate protocols, tokens, and market structure. Be factual, cite reasoning, avoid hype.",
  },
  {
    id: "trading", name: "Trading Agent", role: "Signals & entries", accent: "#22c55e",
    system: "You are the Trading Agent. Propose BUY/SELL/HOLD views with entries, invalidation, and risk/reward. Never give financial guarantees.",
  },
  {
    id: "risk", name: "Risk Analysis Agent", role: "Risk assessment", accent: "#f59e0b",
    system: "You are the Risk Analysis Agent. Surface downside scenarios, position sizing, drawdown, and correlation risks. Be conservative.",
  },
  {
    id: "wallet", name: "Wallet Security Agent", role: "Approvals & scam defense", accent: "#ef4444",
    system: "You are the Wallet Security Agent. Flag risky token approvals, contract red-flags, rug-pull patterns, and phishing vectors. Recommend concrete safeguards.",
  },
  {
    id: "governance", name: "Governance Agent", role: "DAO proposals", accent: "#7b61ff",
    system: "You are the Governance Agent. Analyze DAO proposals, voting trade-offs, and stakeholder impact. Be neutral and structured.",
  },
  {
    id: "treasury", name: "Treasury Agent", role: "Treasury & yield", accent: "#c084fc",
    system: "You are the Treasury Agent. Advise on treasury allocation, runway, diversification, and yield with risk-adjusted reasoning.",
  },
  {
    id: "sentiment", name: "Sentiment Agent", role: "Market sentiment", accent: "#06b6d4",
    system: "You are the Sentiment Agent. Gauge market mood, narrative momentum, and crowd positioning. Distinguish signal from noise.",
  },
];

const AGENT_BY_ID = new Map(AGENTS.map((a) => [a.id, a]));

export interface AgentStep {
  agentId: string;
  agentName: string;
  subtask: string;
  output: string;
  confidence: number; // 0-100
}

export interface CouncilResult {
  plan: { agentId: string; subtask: string }[];
  rationale: string;
  steps: AgentStep[];
  answer: string;
  confidence: number;
  timestamp: number;
}

export type Phase = "planning" | "delegating" | "synthesizing" | "done";

async function chat(system: string, user: string, opts: { json?: boolean; maxTokens?: number } = {}): Promise<string> {
  const body: any = {
    model: MODEL,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: 0.4,
    max_tokens: opts.maxTokens ?? 500,
  };
  if (opts.json) body.response_format = { type: "json_object" };

  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {}) },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Nous API HTTP ${res.status}: ${(await res.text().catch(() => "")).slice(0, 160)}`);
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty response from Nous Hermes");
  return content;
}

function clampConfidence(n: any, fallback = 70): number {
  const v = Math.round(Number(n));
  return Number.isFinite(v) ? Math.max(0, Math.min(100, v)) : fallback;
}

/** Planner: decide which agents to involve and their subtasks. */
async function plan(query: string): Promise<{ plan: { agentId: string; subtask: string }[]; rationale: string }> {
  const roster = AGENTS.map((a) => `- ${a.id}: ${a.role}`).join("\n");
  const sys =
    "You are the CipherMind orchestrator. Given a user task, choose which specialist agents to delegate to and a one-line subtask for each. " +
    `Available agents:\n${roster}\n` +
    'Respond in STRICT JSON: {"rationale":"<why>","plan":[{"agentId":"<id>","subtask":"<one line>"}]}. Pick 2-5 most relevant agents.';
  try {
    const raw = await chat(sys, query, { json: true, maxTokens: 400 });
    const parsed = JSON.parse(raw);
    const valid = (parsed.plan || [])
      .filter((p: any) => AGENT_BY_ID.has(p.agentId))
      .map((p: any) => ({ agentId: p.agentId, subtask: String(p.subtask || "Analyze the task") }));
    if (valid.length) return { plan: valid.slice(0, 5), rationale: String(parsed.rationale || "") };
  } catch {
    /* fall through to default */
  }
  // Robust fallback council if planning fails.
  return {
    rationale: "Default council selected (planner unavailable).",
    plan: [
      { agentId: "research", subtask: "Research the topic" },
      { agentId: "risk", subtask: "Assess the risks" },
      { agentId: "sentiment", subtask: "Gauge sentiment" },
    ],
  };
}

/** Run one agent over its subtask + shared context. */
async function runAgent(def: AgentDef, query: string, subtask: string, context: string): Promise<AgentStep> {
  const sys = `${def.system}\nReturn STRICT JSON: {"output":"<concise analysis, <120 words>","confidence":<0-100>}.`;
  const user = `User task: ${query}\nYour subtask: ${subtask}\nShared council context so far:\n${context || "(none yet)"}`;
  try {
    const raw = await chat(sys, user, { json: true, maxTokens: 400 });
    const parsed = JSON.parse(raw);
    return { agentId: def.id, agentName: def.name, subtask, output: String(parsed.output || raw), confidence: clampConfidence(parsed.confidence) };
  } catch (e: any) {
    return { agentId: def.id, agentName: def.name, subtask, output: `(unavailable: ${e?.message || e})`, confidence: 0 };
  }
}

/** Synthesize the council's findings into one answer + overall confidence. */
async function synthesize(query: string, steps: AgentStep[]): Promise<{ answer: string; confidence: number }> {
  const findings = steps.map((s) => `[${s.agentName} · conf ${s.confidence}%] ${s.output}`).join("\n");
  const sys =
    "You are the CipherMind synthesizer. Merge the specialist agents' findings into one clear, structured answer for the user. " +
    'Note any disagreement. Return STRICT JSON: {"answer":"<final answer>","confidence":<0-100 overall>}.';
  try {
    const raw = await chat(sys, `User task: ${query}\nAgent findings:\n${findings}`, { json: true, maxTokens: 600 });
    const parsed = JSON.parse(raw);
    return { answer: String(parsed.answer || raw), confidence: clampConfidence(parsed.confidence) };
  } catch {
    // Fallback: average confidence + concatenated findings.
    const avg = Math.round(steps.reduce((a, s) => a + s.confidence, 0) / Math.max(1, steps.length));
    return { answer: findings, confidence: avg };
  }
}

/**
 * Orchestrate the full council run. `onPhase`/`onStep` stream progress to the UI.
 */
export async function runCouncil(
  query: string,
  hooks: {
    onPhase?: (p: Phase) => void;
    onPlan?: (plan: { agentId: string; subtask: string }[], rationale: string) => void;
    onStep?: (step: AgentStep) => void;
  } = {},
  timestamp = 0,
): Promise<CouncilResult> {
  hooks.onPhase?.("planning");
  const { plan: selected, rationale } = await plan(query);
  hooks.onPlan?.(selected, rationale);

  hooks.onPhase?.("delegating");
  const steps: AgentStep[] = [];
  let context = "";
  for (const item of selected) {
    const def = AGENT_BY_ID.get(item.agentId)!;
    const step = await runAgent(def, query, item.subtask, context);
    steps.push(step);
    context += `\n${def.name}: ${step.output}`;
    hooks.onStep?.(step);
  }

  hooks.onPhase?.("synthesizing");
  const { answer, confidence } = await synthesize(query, steps);

  hooks.onPhase?.("done");
  return { plan: selected, rationale, steps, answer, confidence, timestamp };
}
