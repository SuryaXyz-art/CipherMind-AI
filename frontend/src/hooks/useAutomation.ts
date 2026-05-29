/**
 * useAutomation — AI strategy planner + safety harness + guarded execution.
 */

import { useState, useCallback } from "react";
import {
  proposeActions, checkSafety, executeSend, DEFAULT_SAFETY,
  type ProposedAction, type Safety,
} from "../lib/automation";

interface AuditEntry { ts: number; text: string; status: "executed" | "blocked" | "failed" }

export function useAutomation() {
  const [safety, setSafety] = useState<Safety>(DEFAULT_SAFETY);
  const [actions, setActions] = useState<ProposedAction[]>([]);
  const [summary, setSummary] = useState<string>("");
  const [planning, setPlanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [executingId, setExecutingId] = useState<string | null>(null);
  const [audit, setAudit] = useState<AuditEntry[]>([]);

  const log = (text: string, status: AuditEntry["status"]) =>
    setAudit((a) => [{ ts: Date.now(), text, status }, ...a].slice(0, 20));

  const setSafetyField = useCallback(<K extends keyof Safety>(k: K, v: Safety[K]) => {
    setSafety((s) => ({ ...s, [k]: v }));
  }, []);

  const plan = useCallback(async (goal: string, context: string) => {
    setPlanning(true);
    setError(null);
    setActions([]);
    setSummary("");
    try {
      const { summary, actions } = await proposeActions(goal, context);
      setSummary(summary);
      setActions(actions);
    } catch (e: any) {
      setError(e?.message || "Planning failed");
    } finally {
      setPlanning(false);
    }
  }, []);

  const execute = useCallback(async (action: ProposedAction, to: string) => {
    const check = checkSafety(action, safety);
    if (!check.allowed) {
      log(`Blocked ${action.type} ${action.amount}: ${check.reasons.join(" ")}`, "blocked");
      return;
    }
    if (!to.trim()) {
      log(`Blocked ${action.type} ${action.amount}: no recipient provided`, "blocked");
      return;
    }
    setExecutingId(action.id);
    try {
      await executeSend(to.trim(), action.amount);
      log(`Executed ${action.type} ${action.amount} USDC → ${to.slice(0, 8)}…`, "executed");
    } catch (e: any) {
      log(`Failed ${action.type} ${action.amount}: ${(e?.message || e).slice(0, 80)}`, "failed");
    } finally {
      setExecutingId(null);
    }
  }, [safety]);

  return { safety, setSafetyField, actions, summary, planning, error, executingId, audit, plan, execute, check: (a: ProposedAction) => checkSafety(a, safety) };
}
