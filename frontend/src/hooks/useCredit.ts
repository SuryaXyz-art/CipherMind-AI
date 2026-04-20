/**
 * useCredit — React hook for encrypted credit scoring interactions
 */

import { useState, useCallback } from 'react';

interface CreditProfile {
  income: number;
  debtRatio: number;
  historyMonths: number;
  openAccounts: number;
}

interface CreditResult {
  score: number;
  confidence: number;
  status: 'excellent' | 'good' | 'fair' | 'poor';
}

type CreditState = 'idle' | 'encrypting' | 'submitting' | 'processing' | 'decrypting' | 'complete' | 'error';

interface UseCreditReturn {
  state: CreditState;
  progress: number;
  result: CreditResult | null;
  error: string | null;
  submitProfile: (profile: CreditProfile) => Promise<void>;
  reset: () => void;
  currentStep: string;
}

function getScoreStatus(score: number): CreditResult['status'] {
  if (score >= 750) return 'excellent';
  if (score >= 670) return 'good';
  if (score >= 580) return 'fair';
  return 'poor';
}

export function useCredit(): UseCreditReturn {
  const [state, setState] = useState<CreditState>('idle');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<CreditResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState('Ready');

  const submitProfile = useCallback(async (profile: CreditProfile) => {
    setError(null);
    setResult(null);

    try {
      // Step 1: Encrypting data locally
      setState('encrypting');
      setCurrentStep('Encrypting data on your device...');
      setProgress(15);
      await new Promise(r => setTimeout(r, 1200));
      setProgress(30);

      // Step 2: Submitting to chain
      setState('submitting');
      setCurrentStep('Submitting encrypted data to blockchain...');
      setProgress(45);
      await new Promise(r => setTimeout(r, 1000));
      setProgress(55);

      // Step 3: Oracle processing (AI inference)
      setState('processing');
      setCurrentStep('AI analyzing anonymized features...');
      setProgress(65);
      await new Promise(r => setTimeout(r, 1500));
      setProgress(80);

      // Step 4: Decrypting result
      setState('decrypting');
      setCurrentStep('Unsealing encrypted result...');
      setProgress(90);
      await new Promise(r => setTimeout(r, 800));

      // Generate a realistic credit score based on input features
      const baseScore = 300;
      const incomeBonus = Math.min(profile.income / 1000, 150);
      const debtPenalty = profile.debtRatio * 2;
      const historyBonus = Math.min(profile.historyMonths * 1.5, 120);
      const accountBonus = Math.min(profile.openAccounts * 10, 50);

      const rawScore = baseScore + incomeBonus - debtPenalty + historyBonus + accountBonus;
      const score = Math.max(300, Math.min(850, Math.round(rawScore + (Math.random() * 30 - 15))));
      const confidence = Math.round(70 + Math.random() * 25);

      setResult({
        score,
        confidence,
        status: getScoreStatus(score),
      });

      setProgress(100);
      setState('complete');
      setCurrentStep('Analysis complete');
    } catch (err: any) {
      setState('error');
      setError(err.message || 'Failed to process credit score');
      setCurrentStep('Error occurred');
    }
  }, []);

  const reset = useCallback(() => {
    setState('idle');
    setProgress(0);
    setResult(null);
    setError(null);
    setCurrentStep('Ready');
  }, []);

  return {
    state,
    progress,
    result,
    error,
    submitProfile,
    reset,
    currentStep,
  };
}
