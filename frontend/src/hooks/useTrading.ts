/**
 * useTrading — React hook for encrypted trading signal interactions
 */

import { useState, useCallback } from 'react';

interface TradingPosition {
  asset: string;
  positionSize: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  riskTolerance: number;
}

interface TradingResult {
  direction: 'BUY' | 'SELL' | 'HOLD';
  strength: number;
  riskLevel: number;
  suggestedEntry: number;
}

type TradingState = 'idle' | 'encrypting' | 'submitting' | 'processing' | 'decrypting' | 'complete' | 'error';

interface UseTradingReturn {
  state: TradingState;
  progress: number;
  result: TradingResult | null;
  error: string | null;
  submitPosition: (position: TradingPosition) => Promise<void>;
  reset: () => void;
  currentStep: string;
}

export function useTrading(): UseTradingReturn {
  const [state, setState] = useState<TradingState>('idle');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<TradingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState('Ready');

  const submitPosition = useCallback(async (position: TradingPosition) => {
    setError(null);
    setResult(null);

    try {
      // Step 1: Encrypting
      setState('encrypting');
      setCurrentStep('Encrypting position data...');
      setProgress(15);
      await new Promise(r => setTimeout(r, 1100));
      setProgress(30);

      // Step 2: Submitting
      setState('submitting');
      setCurrentStep('Submitting to blockchain...');
      setProgress(45);
      await new Promise(r => setTimeout(r, 900));
      setProgress(55);

      // Step 3: AI Processing
      setState('processing');
      setCurrentStep('AI generating trading signal...');
      setProgress(65);
      await new Promise(r => setTimeout(r, 1400));
      setProgress(80);

      // Step 4: Decrypting
      setState('decrypting');
      setCurrentStep('Unsealing signal...');
      setProgress(90);
      await new Promise(r => setTimeout(r, 700));

      // Calculate risk/reward ratio
      const risk = Math.abs(position.entryPrice - position.stopLoss);
      const reward = Math.abs(position.takeProfit - position.entryPrice);
      const rrRatio = risk > 0 ? reward / risk : 1;

      // Generate signal based on R/R ratio and risk tolerance
      let direction: 'BUY' | 'SELL' | 'HOLD';
      let strength: number;
      let riskLevel: number;

      if (rrRatio >= 2.5) {
        direction = 'BUY';
        strength = Math.round(70 + Math.random() * 25);
        riskLevel = Math.round(20 + Math.random() * 20);
      } else if (rrRatio >= 1.5) {
        direction = 'BUY';
        strength = Math.round(50 + Math.random() * 25);
        riskLevel = Math.round(35 + Math.random() * 20);
      } else if (rrRatio < 0.8) {
        direction = 'SELL';
        strength = Math.round(40 + Math.random() * 30);
        riskLevel = Math.round(50 + Math.random() * 30);
      } else {
        direction = 'HOLD';
        strength = Math.round(30 + Math.random() * 30);
        riskLevel = Math.round(40 + Math.random() * 25);
      }

      // Adjust based on risk tolerance
      if (position.riskTolerance <= 3) {
        riskLevel = Math.min(riskLevel + 15, 100);
        strength = Math.max(strength - 10, 10);
      }

      // Suggest entry slightly adjusted from user's entry
      const adjustment = (Math.random() * 4 - 2) / 100; // -2% to +2%
      const suggestedEntry = Math.round(position.entryPrice * (1 + adjustment));

      setResult({
        direction,
        strength,
        riskLevel,
        suggestedEntry,
      });

      setProgress(100);
      setState('complete');
      setCurrentStep('Signal generated');
    } catch (err: any) {
      setState('error');
      setError(err.message || 'Failed to generate trading signal');
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
    submitPosition,
    reset,
    currentStep,
  };
}
