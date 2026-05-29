/**
 * Browser-side Hermes agentic research.
 *
 * Mirrors backend/researchAgent.ts but runs in the browser, calling Nous via
 * the Vite-exposed key. The model can call tools across several turns before
 * answering. Falls back to a single completion if tool-calling isn't available.
 */

const API_KEY = import.meta.env.VITE_NOUS_API_KEY as string | undefined;
const BASE_URL = ((import.meta.env.VITE_NOUS_API_BASE_URL as string) || "https://inference-api.nousresearch.com/v1").replace(/\/$/, "");
const MODEL = (import.meta.env.VITE_NOUS_MODEL as string) || "nousresearch/hermes-4-70b";

export interface ResearchTrace { step: number; tool: string; args: any; result: string }
export interface ResearchResult { answer: string; trace: ResearchTrace[]; model: string; timestamp: number }

const INDICATIVE_PRICES: Record<string, number> = { BTC: 67000, ETH: 3500, SOL: 165, ARB: 0.9, USDC: 1, BNB: 600 };

const TOOLS = [
  {
    type: "function",
    function: {
      name: "get_crypto_price",
      description: "Get the latest indicative USD price for a crypto asset symbol.",
      parameters: { type: "object", properties: { symbol: { type: "string" } }, required: ["symbol"] },
    },
    run: ({ symbol }: any) => {
      const s = String(symbol ?? "").toUpperCase().replace(/USDT?$/, "") || "BTC";
      const p = INDICATIVE_PRICES[s];
      return p ? `${s} ≈ $${p.toLocaleString()} USD (indicative).` : `No indicative price for ${s}.`;
    },
  },
];

const SYSTEM_PROMPT = `You are CipherMind Research, a privacy-preserving crypto/DeFi research agent.
Reason step by step and call tools to gather facts before answering.
Give a concise, well-structured final answer. Never ask the user follow-up questions.`;

async function chat(messages: any[], useTools: boolean): Promise<any> {
  const body: any = { model: MODEL, messages, temperature: 0.4, max_tokens: 700 };
  if (useTools) { body.tools = TOOLS.map(({ run, ...t }) => t); body.tool_choice = "auto"; }
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {}) },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Nous API HTTP ${res.status}: ${(await res.text().catch(() => "")).slice(0, 160)}`);
  const data = await res.json();
  const msg = data?.choices?.[0]?.message;
  if (!msg) throw new Error("Empty response from Nous Hermes AI");
  return msg;
}

export async function runResearch(query: string, maxSteps = 4): Promise<ResearchResult> {
  const byName = new Map(TOOLS.map((t) => [t.function.name, t]));
  const messages: any[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: query },
  ];
  const trace: ResearchTrace[] = [];

  for (let step = 1; step <= maxSteps; step++) {
    const msg = await chat(messages, true);
    messages.push(msg);
    const calls = msg.tool_calls ?? [];
    if (calls.length === 0) {
      return { answer: msg.content ?? "", trace, model: MODEL, timestamp: Date.now() };
    }
    for (const call of calls) {
      let args: any = {};
      try { args = call.function.arguments ? JSON.parse(call.function.arguments) : {}; } catch { /* noop */ }
      const tool = byName.get(call.function.name);
      const result = tool ? String(tool.run(args)) : `Unknown tool ${call.function.name}`;
      trace.push({ step, tool: call.function.name, args, result });
      messages.push({ role: "tool", tool_call_id: call.id, name: call.function.name, content: result });
    }
  }
  const finalMsg = await chat([...messages, { role: "user", content: "Provide your final answer now." }], false);
  return { answer: finalMsg.content ?? "", trace, model: MODEL, timestamp: Date.now() };
}
