/**
 * CipherMind — Realtime on-chain + market intelligence.
 *
 * Uses only public/free sources (no paid provider key required):
 *  - the public Arbitrum Sepolia RPC (live block height, gas, latest block)
 *  - CoinGecko's free public API (live prices, 24h change, trending tokens)
 *
 * If a streaming provider key is added later (Alchemy WSS, Nodit, etc.), the
 * polling here can be swapped for push without touching the UI.
 */

import { JsonRpcProvider, formatUnits } from "ethers";

const RPC_URL = (import.meta.env.VITE_ARB_SEPOLIA_RPC_URL as string) || "https://sepolia-rollup.arbitrum.io/rpc";
const CG = "https://api.coingecko.com/api/v3";

let provider: JsonRpcProvider | null = null;
function rpc(): JsonRpcProvider {
  if (!provider) provider = new JsonRpcProvider(RPC_URL);
  return provider;
}

export interface ChainStats {
  blockNumber: number;
  gasGwei: number;
  blockTime: number; // unix seconds of latest block
  ts: number;
}

export async function getChainStats(): Promise<ChainStats> {
  const p = rpc();
  const [blockNumber, fee, block] = await Promise.all([
    p.getBlockNumber(),
    p.getFeeData(),
    p.getBlock("latest"),
  ]);
  const gasGwei = fee.gasPrice ? Number(formatUnits(fee.gasPrice, "gwei")) : 0;
  return {
    blockNumber,
    gasGwei: Math.round(gasGwei * 1000) / 1000,
    blockTime: block ? Number(block.timestamp) : 0,
    ts: 0,
  };
}

export interface Ticker {
  id: string;
  symbol: string;
  price: number;
  change24h: number;
}

const TRACKED = [
  { id: "bitcoin", symbol: "BTC" },
  { id: "ethereum", symbol: "ETH" },
  { id: "arbitrum", symbol: "ARB" },
  { id: "solana", symbol: "SOL" },
  { id: "usd-coin", symbol: "USDC" },
];

export async function getMarket(): Promise<Ticker[]> {
  const ids = TRACKED.map((t) => t.id).join(",");
  const res = await fetch(`${CG}/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`);
  if (!res.ok) throw new Error(`CoinGecko HTTP ${res.status}`);
  const data = await res.json();
  return TRACKED.map((t) => ({
    id: t.id,
    symbol: t.symbol,
    price: data?.[t.id]?.usd ?? 0,
    change24h: Math.round((data?.[t.id]?.usd_24h_change ?? 0) * 100) / 100,
  }));
}

export interface Trending {
  symbol: string;
  name: string;
  rank: number;
}

export async function getTrending(): Promise<Trending[]> {
  const res = await fetch(`${CG}/search/trending`);
  if (!res.ok) throw new Error(`CoinGecko HTTP ${res.status}`);
  const data = await res.json();
  return (data?.coins ?? []).slice(0, 7).map((c: any) => ({
    symbol: String(c?.item?.symbol ?? "?").toUpperCase(),
    name: String(c?.item?.name ?? ""),
    rank: c?.item?.market_cap_rank ?? 0,
  }));
}

/** Derive simple "volatility" + "smart-money-ish" flags from 24h moves. */
export function deriveSignals(tickers: Ticker[]): { volatile: string[]; movers: string[] } {
  const volatile = tickers.filter((t) => Math.abs(t.change24h) >= 5).map((t) => t.symbol);
  const movers = [...tickers].sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h)).slice(0, 2).map((t) => t.symbol);
  return { volatile, movers };
}

// ── AI market insight (Hermes over the live snapshot) ────────────────────────

const NOUS_KEY = import.meta.env.VITE_NOUS_API_KEY as string | undefined;
const NOUS_URL = ((import.meta.env.VITE_NOUS_API_BASE_URL as string) || "https://inference-api.nousresearch.com/v1").replace(/\/$/, "");
const NOUS_MODEL = (import.meta.env.VITE_NOUS_MODEL as string) || "nousresearch/hermes-4-70b";

export async function getAiInsight(tickers: Ticker[], trending: Trending[], chain: ChainStats): Promise<string> {
  const snapshot =
    `Prices (24h%): ${tickers.map((t) => `${t.symbol} $${t.price} (${t.change24h}%)`).join(", ")}. ` +
    `Trending: ${trending.map((t) => t.symbol).join(", ")}. ` +
    `Arbitrum Sepolia block ${chain.blockNumber}, gas ${chain.gasGwei} gwei.`;
  const res = await fetch(`${NOUS_URL}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(NOUS_KEY ? { Authorization: `Bearer ${NOUS_KEY}` } : {}) },
    body: JSON.stringify({
      model: NOUS_MODEL,
      messages: [
        { role: "system", content: "You are CipherMind's market intelligence agent. Give a tight 3-4 sentence read of the live snapshot: momentum, volatility, and one risk to watch. No financial guarantees." },
        { role: "user", content: snapshot },
      ],
      temperature: 0.4,
      max_tokens: 260,
    }),
  });
  if (!res.ok) throw new Error(`Nous HTTP ${res.status}`);
  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? "No insight available.";
}
