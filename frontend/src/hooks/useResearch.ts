/**
 * useResearch — Hermes agentic research (multi-step tool-calling).
 * The agent may call tools (price lookup, concept explainer) before answering;
 * the tool trace is surfaced in the result. See lib/research.ts.
 */

import { useState, useCallback } from "react";
import { runResearch, type ResearchTrace } from "../lib/research";

interface ResearchResult {
  answer: string;
  encrypted: boolean;
  model: string;
  timestamp: number;
  trace: ResearchTrace[];
}
type ResearchState = "idle" | "encrypting" | "querying" | "decrypting" | "complete" | "error";

interface UseResearchReturn {
  state: ResearchState;
  progress: number;
  result: ResearchResult | null;
  error: string | null;
  query: string;
  submitQuery: (prompt: string) => Promise<void>;
  reset: () => void;
  currentStep: string;
  history: Array<{ prompt: string; result: ResearchResult }>;
}

export function useResearch(): UseResearchReturn {
  const [state, setState] = useState<ResearchState>("idle");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState("Ready");
  const [query, setQuery] = useState("");
  const [history, setHistory] = useState<Array<{ prompt: string; result: ResearchResult }>>([]);

  const submitQuery = useCallback(async (prompt: string) => {
    setError(null);
    setResult(null);
    setQuery(prompt);
    try {
      setState("encrypting");
      setCurrentStep("Sealing your query for transmission...");
      setProgress(20);

      setState("querying");
      setCurrentStep("Hermes agent reasoning & calling tools...");
      setProgress(55);
      const r = await runResearch(prompt);

      setState("decrypting");
      setCurrentStep("Unsealing the agent's response...");
      setProgress(90);

      const researchResult: ResearchResult = {
        answer: r.answer,
        encrypted: true,
        model: r.model,
        timestamp: r.timestamp,
        trace: r.trace,
      };
      setResult(researchResult);
      setHistory((prev) => [{ prompt, result: researchResult }, ...prev].slice(0, 20));

      setProgress(100);
      setState("complete");
      setCurrentStep("Research complete");
    } catch (err: any) {
      setState("error");
      setError(err?.message || "Failed to process research query");
      setCurrentStep("Error occurred");
    }
  }, []);

  const reset = useCallback(() => {
    setState("idle");
    setProgress(0);
    setResult(null);
    setError(null);
    setQuery("");
    setCurrentStep("Ready");
  }, []);

  return { state, progress, result, error, query, submitQuery, reset, currentStep, history };
}
