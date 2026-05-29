/**
 * CipherMind AI — Nous Hermes client (dependency-free)
 *
 * A tiny wrapper over the OpenAI-compatible Chat Completions endpoint exposed
 * by Nous Research (and by the local mock-api.mjs). Uses the global `fetch`
 * (Node 18+) so the oracle has no SDK dependency and runs identically inside a
 * Hardhat task, a standalone script, or the browser.
 */

import * as dotenv from "dotenv";

dotenv.config({ path: "../.env" });
dotenv.config(); // also load a root .env when run from repo root (Hardhat task)

const API_KEY = process.env.NOUS_API_KEY || "";
const BASE_URL = (process.env.NOUS_API_BASE_URL || "https://inference-api.nousresearch.com/v1").replace(/\/$/, "");
const MODEL = process.env.NOUS_MODEL || "nousresearch/hermes-4-70b";

export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
  /** Request strict JSON output (Hermes/OpenAI `response_format`). */
  json?: boolean;
}

/**
 * Send a system + user prompt to Hermes and return the assistant's raw text.
 * Throws on transport / HTTP / empty-response errors so callers can fall back.
 */
export async function nousChat(
  systemPrompt: string,
  userMessage: string,
  opts: ChatOptions = {},
): Promise<string> {
  const body: Record<string, unknown> = {
    model: MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    temperature: opts.temperature ?? 0.3,
    max_tokens: opts.maxTokens ?? 400,
  };
  if (opts.json) body.response_format = { type: "json_object" };

  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {}),
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Nous API HTTP ${res.status}: ${text.slice(0, 200)}`);
  }

  const data: any = await res.json();
  const content: string | undefined = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty response from Nous Hermes AI");
  return content;
}

// ── Raw chat (multi-turn, tool-calling) ─────────────────────────────────────

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  name?: string;
}

export interface ToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

export interface ToolSpec {
  type: "function";
  function: { name: string; description: string; parameters: Record<string, unknown> };
}

/**
 * Lower-level call that returns the full assistant message (so callers can read
 * `tool_calls`). Used by the agentic researcher.
 */
export async function nousChatRaw(
  messages: ChatMessage[],
  opts: ChatOptions & { tools?: ToolSpec[] } = {},
): Promise<ChatMessage> {
  const body: Record<string, unknown> = {
    model: MODEL,
    messages,
    temperature: opts.temperature ?? 0.4,
    max_tokens: opts.maxTokens ?? 700,
  };
  if (opts.json) body.response_format = { type: "json_object" };
  if (opts.tools?.length) {
    body.tools = opts.tools;
    body.tool_choice = "auto";
  }

  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Nous API HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
  const data: any = await res.json();
  const msg: ChatMessage | undefined = data?.choices?.[0]?.message;
  if (!msg) throw new Error("Empty response from Nous Hermes AI");
  return msg;
}

export const NOUS_MODEL = MODEL;
