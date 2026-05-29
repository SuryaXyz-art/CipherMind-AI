/**
 * useRealtime — live chain + market intelligence via polling (public sources).
 * Chain stats refresh every 5s; market every 20s (CoinGecko free-tier limits).
 */

import { useState, useEffect, useCallback } from "react";
import {
  getChainStats, getMarket, getTrending, getAiInsight, deriveSignals,
  type ChainStats, type Ticker, type Trending,
} from "../lib/realtime";

export function useRealtime(active: boolean) {
  const [chain, setChain] = useState<ChainStats | null>(null);
  const [tickers, setTickers] = useState<Ticker[]>([]);
  const [trending, setTrending] = useState<Trending[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [insight, setInsight] = useState<string | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);

  // Live chain polling (5s)
  useEffect(() => {
    if (!active) return;
    let alive = true;
    const tick = async () => {
      try {
        const c = await getChainStats();
        if (alive) { setChain({ ...c }); setError(null); }
      } catch (e: any) {
        if (alive) setError(e?.message || "RPC error");
      }
    };
    tick();
    const id = setInterval(tick, 5000);
    return () => { alive = false; clearInterval(id); };
  }, [active]);

  // Market polling (20s)
  useEffect(() => {
    if (!active) return;
    let alive = true;
    const tick = async () => {
      try {
        const [m, t] = await Promise.all([getMarket(), getTrending()]);
        if (alive) { setTickers(m); setTrending(t); }
      } catch {
        /* CoinGecko rate-limit / transient — keep last values */
      }
    };
    tick();
    const id = setInterval(tick, 20000);
    return () => { alive = false; clearInterval(id); };
  }, [active]);

  const refreshInsight = useCallback(async () => {
    if (!chain || !tickers.length) return;
    setInsightLoading(true);
    try {
      setInsight(await getAiInsight(tickers, trending, chain));
    } catch (e: any) {
      setInsight(`AI insight unavailable: ${e?.message || e}`);
    } finally {
      setInsightLoading(false);
    }
  }, [chain, tickers, trending]);

  const signals = deriveSignals(tickers);

  return { chain, tickers, trending, signals, error, insight, insightLoading, refreshInsight };
}
