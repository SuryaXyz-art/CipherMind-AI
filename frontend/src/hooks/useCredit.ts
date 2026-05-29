/**
 * useCredit — real FHE credit-scoring flow against CipherMindCredit.
 *
 *   encrypt locally → submitProfile (on-chain) → wait for oracle fulfillment →
 *   unseal the score with your permit. Plus the confidential features:
 *   benchmark comparison, encrypted threshold alert, selective disclosure.
 */

import { useState, useCallback } from "react";
import { encryptUint32s, unsealUint32, unsealBool } from "../lib/cofhe";
import { getCreditContract, getSigner, pollUntil, ORACLE_TIMEOUT_MESSAGE } from "../lib/contracts";

interface CreditProfile { income: number; debtRatio: number; historyMonths: number; openAccounts: number }
interface CreditResult { score: number; confidence: number; status: "excellent" | "good" | "fair" | "poor" }
type CreditState = "idle" | "encrypting" | "submitting" | "processing" | "decrypting" | "complete" | "error";

interface UseCreditReturn {
  state: CreditState;
  progress: number;
  result: CreditResult | null;
  error: string | null;
  currentStep: string;
  submitProfile: (profile: CreditProfile) => Promise<void>;
  reset: () => void;
  // confidential features (require a fulfilled score)
  benchmark: { loading: boolean; aboveAverage: boolean | null; error: string | null };
  runBenchmark: () => Promise<void>;
  threshold: { loading: boolean; meets: boolean | null; value: number | null; error: string | null };
  checkThreshold: (value: number) => Promise<void>;
  grant: { loading: boolean; grantedTo: string | null; error: string | null };
  grantAccess: (viewer: string) => Promise<void>;
}

function getScoreStatus(score: number): CreditResult["status"] {
  if (score >= 750) return "excellent";
  if (score >= 670) return "good";
  if (score >= 580) return "fair";
  return "poor";
}

export function useCredit(): UseCreditReturn {
  const [state, setState] = useState<CreditState>("idle");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<CreditResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState("Ready");

  const [benchmark, setBenchmark] = useState<UseCreditReturn["benchmark"]>({ loading: false, aboveAverage: null, error: null });
  const [threshold, setThreshold] = useState<UseCreditReturn["threshold"]>({ loading: false, meets: null, value: null, error: null });
  const [grant, setGrant] = useState<UseCreditReturn["grant"]>({ loading: false, grantedTo: null, error: null });

  const submitProfile = useCallback(async (profile: CreditProfile) => {
    setError(null);
    setResult(null);
    setBenchmark({ loading: false, aboveAverage: null, error: null });
    setThreshold({ loading: false, meets: null, value: null, error: null });
    setGrant({ loading: false, grantedTo: null, error: null });

    try {
      const credit = await getCreditContract();
      const address = await (await getSigner()).getAddress();

      // 1. Encrypt locally
      setState("encrypting");
      setCurrentStep("Encrypting your data on-device (FHE)...");
      setProgress(15);
      const enc = await encryptUint32s([
        Math.round(profile.income),
        Math.round(profile.debtRatio),
        Math.round(profile.historyMonths),
        Math.round(profile.openAccounts),
      ]);

      // 2. Submit on-chain
      setState("submitting");
      setCurrentStep("Submitting encrypted profile to Arbitrum Sepolia...");
      setProgress(40);
      const tx = await credit.submitProfile(enc[0], enc[1], enc[2], enc[3]);
      await tx.wait();

      // 3. Wait for the oracle (off-chain Nous Hermes) to fulfill
      setState("processing");
      setCurrentStep("Oracle analyzing anonymized features via Nous Hermes...");
      setProgress(60);
      const fulfilled = await pollUntil(
        async () => (await credit.results(address)).fulfilled,
        {
          onWait: (ms) => {
            const s = Math.round(ms / 1000);
            setCurrentStep(
              s < 16
                ? `Oracle analyzing anonymized features via Nous Hermes... (${s}s)`
                : `Still waiting for the oracle (${s}s)… make sure the oracle service is running.`,
            );
          },
        },
      );
      if (!fulfilled) throw new Error(ORACLE_TIMEOUT_MESSAGE);

      // 4. Unseal the encrypted result (only you can)
      setState("decrypting");
      setCurrentStep("Unsealing your encrypted score...");
      setProgress(85);
      const r = await credit.results(address);
      const score = await unsealUint32(r.score);
      const confidence = await unsealUint32(r.confidence);

      setResult({ score, confidence, status: getScoreStatus(score) });
      setProgress(100);
      setState("complete");
      setCurrentStep("Analysis complete");
    } catch (err: any) {
      setState("error");
      setError(err?.message || "Failed to process credit score");
      setCurrentStep("Error occurred");
    }
  }, []);

  const runBenchmark = useCallback(async () => {
    setBenchmark({ loading: true, aboveAverage: null, error: null });
    try {
      const credit = await getCreditContract();
      const tx = await credit.requestBenchmarkComparison();
      await tx.wait();
      const handle = await credit.getBenchmarkResult();
      const above = await unsealBool(handle);
      setBenchmark({ loading: false, aboveAverage: above, error: null });
    } catch (err: any) {
      setBenchmark({ loading: false, aboveAverage: null, error: err?.message || "Benchmark failed" });
    }
  }, []);

  const checkThreshold = useCallback(async (value: number) => {
    setThreshold({ loading: true, meets: null, value, error: null });
    try {
      const credit = await getCreditContract();
      const enc = await encryptUint32s([Math.round(value)]);
      const tx = await credit.evaluateScoreThreshold(enc[0]);
      await tx.wait();
      const handle = await credit.getThresholdResult();
      const meets = await unsealBool(handle);
      setThreshold({ loading: false, meets, value, error: null });
    } catch (err: any) {
      setThreshold({ loading: false, meets: null, value, error: err?.message || "Threshold check failed" });
    }
  }, []);

  const grantAccess = useCallback(async (viewer: string) => {
    setGrant({ loading: true, grantedTo: null, error: null });
    try {
      const credit = await getCreditContract();
      const tx = await credit.grantScoreAccess(viewer);
      await tx.wait();
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
    setThreshold({ loading: false, meets: null, value: null, error: null });
    setGrant({ loading: false, grantedTo: null, error: null });
  }, []);

  return {
    state, progress, result, error, currentStep,
    submitProfile, reset,
    benchmark, runBenchmark,
    threshold, checkThreshold,
    grant, grantAccess,
  };
}
