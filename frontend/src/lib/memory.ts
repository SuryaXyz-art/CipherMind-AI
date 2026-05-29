/**
 * CipherMind — Encrypted AI Memory.
 *
 * Persistent agent memory (notes, preferences, risk profile, conversation
 * snippets) encrypted at rest with AES-GCM. The key is derived from a wallet
 * signature over a fixed message, so memory is bound to the wallet and only the
 * owner can decrypt it — raw memory never sits in plaintext storage. Retrieval
 * is lightweight keyword ranking (a real hosted vector DB would need a backend;
 * this is the local, no-infra version).
 */

import { BrowserProvider } from "ethers";

const SIGN_MESSAGE = "CipherMind Encrypted Memory Key v1 — sign to unlock your private AI memory. This is free and off-chain.";
const STORE_PREFIX = "cm-mem-v1:";

export type MemoryKind = "note" | "preference" | "risk" | "conversation";
export interface MemoryEntry {
  id: string;
  kind: MemoryKind;
  text: string;
  ts: number;
}

// ── Key derivation (wallet signature → AES-GCM key) ──────────────────────────

export async function deriveMemoryKey(): Promise<{ address: string; key: CryptoKey }> {
  const eth = (window as any).ethereum;
  if (!eth) throw new Error("No Ethereum wallet detected.");
  const provider = new BrowserProvider(eth);
  const signer = await provider.getSigner();
  const address = (await signer.getAddress()).toLowerCase();
  const signature = await signer.signMessage(SIGN_MESSAGE);
  const sigBytes = new TextEncoder().encode(signature);
  const digest = await crypto.subtle.digest("SHA-256", sigBytes);
  const key = await crypto.subtle.importKey("raw", digest, "AES-GCM", false, ["encrypt", "decrypt"]);
  return { address, key };
}

// ── AES-GCM helpers ──────────────────────────────────────────────────────────

function toB64(b: Uint8Array): string { return btoa(String.fromCharCode(...b)); }
function fromB64(s: string): Uint8Array { return Uint8Array.from(atob(s), (c) => c.charCodeAt(0)); }

async function encryptJSON(key: CryptoKey, value: unknown): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = new TextEncoder().encode(JSON.stringify(value));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv as BufferSource }, key, data as BufferSource));
  return `${toB64(iv)}.${toB64(ct)}`;
}

async function decryptJSON<T>(key: CryptoKey, blob: string): Promise<T> {
  const [ivB64, ctB64] = blob.split(".");
  const iv = fromB64(ivB64);
  const ct = fromB64(ctB64);
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: iv as BufferSource }, key, ct as BufferSource);
  return JSON.parse(new TextDecoder().decode(pt)) as T;
}

// ── Persistence ──────────────────────────────────────────────────────────────

export async function loadMemories(address: string, key: CryptoKey): Promise<MemoryEntry[]> {
  const blob = localStorage.getItem(STORE_PREFIX + address);
  if (!blob) return [];
  try {
    return await decryptJSON<MemoryEntry[]>(key, blob);
  } catch {
    return []; // wrong key / corrupted — treat as empty
  }
}

export async function saveMemories(address: string, key: CryptoKey, entries: MemoryEntry[]): Promise<void> {
  localStorage.setItem(STORE_PREFIX + address, await encryptJSON(key, entries));
}

/** The raw encrypted blob (for showing the sealed ████ representation). */
export function rawBlob(address: string): string | null {
  return localStorage.getItem(STORE_PREFIX + address);
}

// ── Retrieval (lightweight keyword ranking) ─────────────────────────────────

export function retrieve(entries: MemoryEntry[], query: string, n = 5): MemoryEntry[] {
  const terms = query.toLowerCase().split(/\W+/).filter((t) => t.length > 2);
  if (!terms.length) return [...entries].sort((a, b) => b.ts - a.ts).slice(0, n);
  const scored = entries.map((e) => {
    const text = e.text.toLowerCase();
    const score = terms.reduce((s, t) => s + (text.includes(t) ? 1 : 0), 0) + (e.kind === "preference" || e.kind === "risk" ? 0.5 : 0);
    return { e, score };
  });
  return scored.filter((x) => x.score > 0).sort((a, b) => b.score - a.score || b.e.ts - a.e.ts).slice(0, n).map((x) => x.e);
}

// ── Memory-aware AI query ────────────────────────────────────────────────────

const NOUS_KEY = import.meta.env.VITE_NOUS_API_KEY as string | undefined;
const NOUS_URL = ((import.meta.env.VITE_NOUS_API_BASE_URL as string) || "https://inference-api.nousresearch.com/v1").replace(/\/$/, "");
const NOUS_MODEL = (import.meta.env.VITE_NOUS_MODEL as string) || "nousresearch/hermes-4-70b";

export async function askWithMemory(query: string, memories: MemoryEntry[]): Promise<string> {
  const ctx = memories.length
    ? memories.map((m) => `- [${m.kind}] ${m.text}`).join("\n")
    : "(no relevant memory)";
  const res = await fetch(`${NOUS_URL}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(NOUS_KEY ? { Authorization: `Bearer ${NOUS_KEY}` } : {}) },
    body: JSON.stringify({
      model: NOUS_MODEL,
      messages: [
        { role: "system", content: "You are CipherMind, a personal AI that remembers the user. Use the provided private memory to tailor your answer. Be concise." },
        { role: "user", content: `Known memory about me:\n${ctx}\n\nMy question: ${query}` },
      ],
      temperature: 0.4, max_tokens: 350,
    }),
  });
  if (!res.ok) throw new Error(`Nous HTTP ${res.status}`);
  return (await res.json())?.choices?.[0]?.message?.content ?? "No response.";
}
