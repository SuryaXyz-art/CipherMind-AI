/**
 * useMemory — unlock (wallet-signature key), manage, and query encrypted memory.
 */

import { useState, useCallback } from "react";
import {
  deriveMemoryKey, loadMemories, saveMemories, retrieve, askWithMemory, rawBlob,
  type MemoryEntry, type MemoryKind,
} from "../lib/memory";

export function useMemory() {
  const [unlocked, setUnlocked] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [key, setKey] = useState<CryptoKey | null>(null);
  const [entries, setEntries] = useState<MemoryEntry[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [used, setUsed] = useState<MemoryEntry[]>([]);
  const [asking, setAsking] = useState(false);

  const unlock = useCallback(async () => {
    setBusy(true); setError(null);
    try {
      const { address, key } = await deriveMemoryKey();
      setAddress(address); setKey(key);
      setEntries(await loadMemories(address, key));
      setUnlocked(true);
    } catch (e: any) {
      setError(e?.message || "Unlock failed");
    } finally {
      setBusy(false);
    }
  }, []);

  const persist = useCallback(async (next: MemoryEntry[]) => {
    setEntries(next);
    if (address && key) await saveMemories(address, key, next);
  }, [address, key]);

  const add = useCallback(async (kind: MemoryKind, text: string) => {
    if (!text.trim()) return;
    const entry: MemoryEntry = { id: `${Date.now()}-${Math.floor(Math.random() * 1e6)}`, kind, text: text.trim(), ts: Date.now() };
    await persist([entry, ...entries]);
  }, [entries, persist]);

  const remove = useCallback(async (id: string) => {
    await persist(entries.filter((e) => e.id !== id));
  }, [entries, persist]);

  const clearAll = useCallback(async () => { await persist([]); }, [persist]);

  const ask = useCallback(async (q: string) => {
    setAsking(true); setAnswer(null);
    try {
      const relevant = retrieve(entries, q, 5);
      setUsed(relevant);
      setAnswer(await askWithMemory(q, relevant));
    } catch (e: any) {
      setAnswer(`Unavailable: ${e?.message || e}`);
    } finally {
      setAsking(false);
    }
  }, [entries]);

  return {
    unlocked, address, entries, busy, error,
    unlock, add, remove, clearAll,
    query, setQuery, answer, used, asking, ask,
    sealed: !!rawBlob(address || "") && !unlocked,
  };
}
