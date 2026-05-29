/**
 * useTrading — real FHE trading-signal flow against CipherMindTrading.
 *   encrypt position → submitPosition → wait for oracle → unseal the signal.
 */

import { useState, useCallback } from "react";
import { encryptUint32s, unsealUint32, unsealBool } from "../lib/cofhe";
import { getTradingContract, getSigner, pollUntil } from "../lib/contracts";

interface TradingPosition {
  asset: string;
  positionSize: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  riskTolerance: number;
}
interface TradingResult {
  direction: "BUY" | "SELL" | "HOLD";
  strength: number;
  riskLevel: number;
  suggestedEntry: number;
}
type TradingState = "idle" | "encrypting" | "submitting" | "processing" | "decrypting" | "complete" | "error";

interface UseTradingReturn {
  state: TradingState;
  progress: number;
  result: TradingResult | null;
  error: string | null;
  submitPosition: (position: TradingPosition) => Promise<void>;
  reset: () => void;
  currentStep: string;
  // confidential features (require a fulfilled signal)
  benchmark: { loading: boolean; aboveAverage: boolean | null; error: string | null };
  runBenchmark: () => Promise<void>;
  riskThreshold: { loading: boolean; breached: boolean | null; value: number | null; error: string | null };
  checkRiskThreshold: (value: number) => Promise<void>;
  grant: { loading: boolean; grantedTo: string | null; error: string | null };
  grantAccess: (viewer: string) => Promise<void>;
}

const DIR = ["HOLD", "BUY", "SELL"] as const;

export function useTrading(): UseTradingReturn {
  const [state, setState] = useState<TradingState>("idle");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<TradingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState("Ready");
  const [benchmark, setBenchmark] = useState<UseTradingReturn["benchmark"]>({ loading: false, aboveAverage: null, error: null });
  const [riskThreshold, setRiskThreshold] = useState<UseTradingReturn["riskThreshold"]>({ loading: false, breached: null, value: null, error: null });
  const [grant, setGrant] = useState<UseTradingReturn["grant"]>({ loading: false, grantedTo: null, error: null });

  const submitPosition = useCallback(async (position: TradingPosition) => {
    setError(null);
    setResult(null);
    try {
      const trading = await getTradingContract();
      const address = await (await getSigner()).getAddress();

      setState("encrypting");
      setCurrentStep("Encrypting your position on-device (FHE)...");
      setProgress(15);
      // Prices are stored ×100 on-chain; position size in whole USD.
      const enc = await encryptUint32s([
        Math.round(position.positionSize),
        Math.round(position.entryPrice * 100),
        Math.round(position.stopLoss * 100),
        Math.round(position.takeProfit * 100),
        Math.round(position.riskTolerance),
      ]);

      setState("submitting");
      setCurrentStep("Submitting encrypted position to Arbitrum Sepolia...");
      setProgress(40);
      const tx = await trading.submitPosition(enc[0], enc[1], enc[2], enc[3], enc[4], position.asset);
      await tx.wait();

      setState("processing");
      setCurrentStep("Oracle generating signal via Nous Hermes...");
      setProgress(62);
      const fulfilled = await pollUntil(async () => (await trading.latestSignal(address)).fulfilled);
      if (!fulfilled) throw new Error("Timed out waiting for the oracle. Is the oracle service running?");

      setState("decrypting");
      setCurrentStep("Unsealing your encrypted signal...");
      setProgress(85);
      const s = await trading.latestSignal(address);
      const direction = DIR[await unsealUint32(s.direction)] ?? "HOLD";
      const strength = await unsealUint32(s.strength);
      const riskLevel = await unsealUint32(s.riskLevel);
      const suggestedEntry = (await unsealUint32(s.suggestedEntry)) / 100;

      setResult({ direction, strength, riskLevel, suggestedEntry });
      setProgress(100);
      setState("complete");
      setCurrentStep("Signal generated");
    } catch (err: any) {
      setState("error");
      setError(err?.message || "Failed to generate trading signal");
      setCurrentStep("Error occurred");
    }
  }, []);

  const runBenchmark = useCallback(async () => {
    setBenchmark({ loading: true, aboveAverage: null, error: null });
    try {
      const trading = await getTradingContract();
      await (await trading.requestStrengthBenchmark()).wait();
      const handle = await trading.getBenchmarkResult();
      setBenchmark({ loading: false, aboveAverage: await unsealBool(handle), error: null });
    } catch (err: any) {
      setBenchmark({ loading: false, aboveAverage: null, error: err?.message || "Benchmark failed" });
    }
  }, []);

  const checkRiskThreshold = useCallback(async (value: number) => {
    setRiskThreshold({ loading: true, breached: null, value, error: null });
    try {
      const trading = await getTradingContract();
      const enc = await encryptUint32s([Math.round(value)]);
      await (await trading.evaluateRiskThreshold(enc[0])).wait();
      const handle = await trading.getRiskThresholdResult();
      setRiskThreshold({ loading: false, breached: await unsealBool(handle), value, error: null });
    } catch (err: any) {
      setRiskThreshold({ loading: false, breached: null, value, error: err?.message || "Risk check failed" });
    }
  }, []);

  const grantAccess = useCallback(async (viewer: string) => {
    setGrant({ loading: true, grantedTo: null, error: null });
    try {
      const trading = await getTradingContract();
      await (await trading.grantSignalAccess(viewer)).wait();
      setGrant({ loading: false, grantedTo: viewer, error: null });
    } catch (err: any) {
      setGrant({ loading: false, grantedTo: null, error: err?.message || "Grant failed" });
    }
  }, []);

  const reset = useCallback(() => {
    setState("idle");
    setProgress(0);
    setResult(null);
    setError(null);
    setCurrentStep("Ready");
    setBenchmark({ loading: false, aboveAverage: null, error: null });
    setRiskThreshold({ loading: false, breached: null, value: null, error: null });
    setGrant({ loading: false, grantedTo: null, error: null });
  }, []);

  return {
    state, progress, result, error, submitPosition, reset, currentStep,
    benchmark, runBenchmark,
    riskThreshold, checkRiskThreshold,
    grant, grantAccess,
  };
}
