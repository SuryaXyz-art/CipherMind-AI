/**
 * useMarketplace — manage agent-workflow templates (builtin + saved + import/export).
 */

import { useState, useCallback } from "react";
import {
  BUILTIN_TEMPLATES, loadUserTemplates, saveUserTemplates, exportTemplate, importTemplate,
  type AgentTemplate,
} from "../lib/marketplace";

export function useMarketplace() {
  const [user, setUser] = useState<AgentTemplate[]>(() => loadUserTemplates());
  const [error, setError] = useState<string | null>(null);
  const [exported, setExported] = useState<{ id: string; code: string } | null>(null);

  const all = [...BUILTIN_TEMPLATES, ...user];

  const persist = useCallback((list: AgentTemplate[]) => {
    setUser(list);
    saveUserTemplates(list);
  }, []);

  const create = useCallback((name: string, description: string, prompt: string) => {
    if (!name.trim() || !prompt.trim()) return;
    const t: AgentTemplate = {
      id: `user-${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
      name: name.trim(), description: description.trim(), prompt: prompt.trim(), author: "you",
    };
    persist([t, ...user]);
  }, [user, persist]);

  const remove = useCallback((id: string) => {
    persist(user.filter((t) => t.id !== id));
  }, [user, persist]);

  const doExport = useCallback((t: AgentTemplate) => {
    setExported({ id: t.id, code: exportTemplate(t) });
  }, []);

  const doImport = useCallback((code: string) => {
    setError(null);
    try {
      const t = importTemplate(code);
      persist([t, ...user]);
    } catch (e: any) {
      setError(e?.message || "Invalid template code");
    }
  }, [user, persist]);

  return { all, user, error, exported, create, remove, doExport, doImport, setExported };
}
