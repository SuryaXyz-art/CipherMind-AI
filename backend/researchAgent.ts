/**
 * CipherMind AI — Hermes agentic research
 *
 * A multi-step ReAct-style agent over Nous Hermes: the model can call tools
 * (crypto price lookup, FHE/protocol knowledge) across several turns before
 * producing a final, grounded answer. The LLM call is injected (`complete`) so
 * the control loop is testable offline and reusable in the browser.
 */

import {
  nousChatRaw,
  type ChatMessage,
  type ToolCall,
  type ToolSpec,
} from "./nousClient";

export interface AgentTool {
  spec: ToolSpec;
  run: (args: Record<string, any>) => Promise<string> | string;
}

export interface AgentTrace {
  step: number;
  tool: string;
  args: Record<string, any>;
  result: string;
}

export interface AgentResult {
  answer: string;
  trace: AgentTrace[];
  steps: number;
}

export type Completer = (
  messages: ChatMessage[],
  tools: ToolSpec[],
) => Promise<ChatMessage>;

const DEFAULT_COMPLETE: Completer = (messages, tools) =>
  nousChatRaw(messages, { tools, temperature: 0.4, maxTokens: 700 });

const SYSTEM_PROMPT = `You are CipherMind Research, a privacy-preserving crypto/DeFi research agent.
You reason step by step and may call tools to gather facts before answering.
When you have enough information, give a concise, well-structured final answer.
Never ask the user follow-up questions — make reasonable assumptions and answer.`;

/**
 * Run the agent until it produces a final answer or hits maxSteps.
 */
export async function runResearchAgent(
  query: string,
  opts: { tools?: AgentTool[]; complete?: Completer; maxSteps?: number } = {},
): Promise<AgentResult> {
  const tools = opts.tools ?? defaultTools();
  const complete = opts.complete ?? DEFAULT_COMPLETE;
  const maxSteps = opts.maxSteps ?? 5;
  const specs = tools.map((t) => t.spec);
  const byName = new Map(tools.map((t) => [t.spec.function.name, t]));

  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: query },
  ];
  const trace: AgentTrace[] = [];

  for (let step = 1; step <= maxSteps; step++) {
    const msg = await complete(messages, specs);
    messages.push(msg);

    const calls: ToolCall[] = msg.tool_calls ?? [];
    if (calls.length === 0) {
      return { answer: msg.content ?? "", trace, steps: step };
    }

    // Execute each requested tool and feed results back.
    for (const call of calls) {
      const tool = byName.get(call.function.name);
      let result: string;
      let args: Record<string, any> = {};
      try {
        args = call.function.arguments ? JSON.parse(call.function.arguments) : {};
      } catch {
        /* leave args empty on malformed JSON */
      }
      if (!tool) {
        result = `Error: unknown tool "${call.function.name}"`;
      } else {
        try {
          result = String(await tool.run(args));
        } catch (e: any) {
          result = `Error running ${call.function.name}: ${e?.message ?? e}`;
        }
      }
      trace.push({ step, tool: call.function.name, args, result });
      messages.push({
        role: "tool",
        tool_call_id: call.id,
        name: call.function.name,
        content: result,
      });
    }
  }

  // Ran out of steps — ask for a final answer with no more tools.
  const finalMsg = await complete(
    [...messages, { role: "user", content: "Provide your final answer now." }],
    [],
  );
  return { answer: finalMsg.content ?? "", trace, steps: maxSteps };
}

// ── Default tool set (self-contained, no external network) ───────────────────

/**
 * Indicative prices so the demo works offline / without paid market APIs.
 * Swap `run` for a real fetch (e.g. CoinGecko) when an API key is available.
 */
const INDICATIVE_PRICES: Record<string, number> = {
  BTC: 67000, ETH: 3500, SOL: 165, ARB: 0.9, USDC: 1, BNB: 600,
};

export function defaultTools(): AgentTool[] {
  return [
    {
      spec: {
        type: "function",
        function: {
          name: "get_crypto_price",
          description: "Get the latest indicative USD price for a crypto asset symbol.",
          parameters: {
            type: "object",
            properties: { symbol: { type: "string", description: "Asset symbol, e.g. BTC" } },
            required: ["symbol"],
          },
        },
      },
      run: ({ symbol }) => {
        const s = String(symbol ?? "").toUpperCase().replace(/USDT?$/, "") || "BTC";
        const price = INDICATIVE_PRICES[s];
        return price
          ? `${s} ≈ $${price.toLocaleString()} USD (indicative).`
          : `No indicative price available for ${s}.`;
      },
    },
    {
      spec: {
        type: "function",
        function: {
          name: "explain_concept",
          description: "Return a short factual explanation of an FHE / DeFi / crypto concept.",
          parameters: {
            type: "object",
            properties: { topic: { type: "string", description: "Concept to explain" } },
            required: ["topic"],
          },
        },
      },
      run: ({ topic }) => {
        const t = String(topic ?? "").toLowerCase();
        if (t.includes("fhe") || t.includes("homomorphic"))
          return "Fully Homomorphic Encryption lets computation run directly on ciphertext; results decrypt to the same value as if computed on plaintext, so data stays private throughout.";
        if (t.includes("yield") || t.includes("farm"))
          return "Yield farming earns returns by supplying liquidity/collateral to DeFi protocols; key risks are impermanent loss, smart-contract bugs, and reward-token depreciation.";
        return `General context on "${topic}": consider fundamentals, on-chain metrics, liquidity, and risk before acting.`;
      },
    },
  ];
}

export { nousChatRaw };
