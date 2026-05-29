/**
 * useAgents — drives the multi-agent Hermes council with live progress.
 */

import { useState, useCallback } from "react";
import { runCouncil, type AgentStep, type CouncilResult, type Phase } from "../lib/agents";

interface AgentsState {
  phase: Phase | "idle";
  plan: { agentId: string; subtask: string }[];
  rationale: string;
  steps: AgentStep[];
  result: CouncilResult | null;
  error: string | null;
  history: CouncilResult[];
}

const initial: AgentsState = { phase: "idle", plan: [], rationale: "", steps: [], result: null, error: null, history: [] };

export function useAgents() {
  const [s, setS] = useState<AgentsState>(initial);

  const run = useCallback(async (query: string) => {
    setS((p) => ({ ...p, phase: "planning", plan: [], rationale: "", steps: [], result: null, error: null }));
    try {
      const result = await runCouncil(
        query,
        {
          onPhase: (phase) => setS((p) => ({ ...p, phase })),
          onPlan: (plan, rationale) => setS((p) => ({ ...p, plan, rationale })),
          onStep: (step) => setS((p) => ({ ...p, steps: [...p.steps, step] })),
        },
        Date.now(),
      );
      setS((p) => ({ ...p, phase: "done", result, history: [result, ...p.history].slice(0, 10) }));
    } catch (err: any) {
      setS((p) => ({ ...p, phase: "idle", error: err?.message || "Council failed" }));
    }
  }, []);

  const reset = useCallback(() => setS((p) => ({ ...initial, history: p.history })), []);

  return { ...s, run, reset, busy: s.phase !== "idle" && s.phase !== "done" };
}
