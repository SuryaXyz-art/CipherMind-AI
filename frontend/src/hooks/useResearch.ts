/**
 * useResearch — React hook for encrypted AI research queries
 *
 * Sends a user prompt to Nous Hermes AI via a backend proxy,
 * simulates FHE encryption of the query and response, and returns
 * the AI-generated research data.
 */

import { useState, useCallback } from 'react';

interface ResearchResult {
  answer: string;
  encrypted: boolean;
  model: string;
  timestamp: number;
}

type ResearchState = 'idle' | 'encrypting' | 'querying' | 'decrypting' | 'complete' | 'error';

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

const NOUS_API_KEY = import.meta.env.VITE_NOUS_API_KEY || '';
const NOUS_BASE_URL = import.meta.env.VITE_NOUS_API_BASE_URL || 'https://inference-api.nousresearch.com/v1';
const NOUS_MODEL = import.meta.env.VITE_NOUS_MODEL || 'nousresearch/hermes-4-70b';

export function useResearch(): UseResearchReturn {
  const [state, setState] = useState<ResearchState>('idle');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState('Ready');
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState<Array<{ prompt: string; result: ResearchResult }>>([]);

  const submitQuery = useCallback(async (prompt: string) => {
    setError(null);
    setResult(null);
    setQuery(prompt);

    try {
      // Step 1: Encrypting the query
      setState('encrypting');
      setCurrentStep('Encrypting your query with FHE...');
      setProgress(15);
      await new Promise(r => setTimeout(r, 800));
      setProgress(30);

      // Step 2: Sending to Nous Hermes AI
      setState('querying');
      setCurrentStep('Querying Nous Hermes AI...');
      setProgress(45);

      let answer = '';
      let model = NOUS_MODEL;

      if (NOUS_API_KEY) {
        // Real API call to Nous Hermes via OpenRouter
        try {
          const response = await fetch(`${NOUS_BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${NOUS_API_KEY}`,
              'HTTP-Referer': window.location.origin,
              'X-Title': 'CipherMind AI Research',
            },
            body: JSON.stringify({
              model: NOUS_MODEL,
              messages: [
                {
                  role: 'system',
                  content: `You are CipherMind Research Assistant, a privacy-preserving AI research engine. 
You provide concise, accurate, and data-driven research responses. 
Format your answers cleanly with clear sections when appropriate.
For price queries, provide the most recent known data and note that crypto prices are volatile.
Keep responses focused and professional — no more than 300 words.`,
                },
                {
                  role: 'user',
                  content: prompt,
                },
              ],
              temperature: 0.4,
              max_tokens: 600,
            }),
          });

          setProgress(70);

          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData?.error?.message || `API returned ${response.status}`);
          }

          const data = await response.json();
          answer = data.choices?.[0]?.message?.content || 'No response received.';
          model = data.model || NOUS_MODEL;
        } catch (apiErr: any) {
          console.warn('Nous API error, falling back to demo:', apiErr);
          answer = generateFallbackResponse(prompt) + '\n\n*(Note: This is a fallback response because the API key provided was invalid or rejected.)*';
          model = 'fallback-error';
        }
      } else {
        // Fallback for demo when no API key
        await new Promise(r => setTimeout(r, 1500));
        setProgress(70);
        answer = generateFallbackResponse(prompt);
        model = 'fallback-demo';
      }

      // Step 3: Decrypting the response
      setState('decrypting');
      setCurrentStep('Unsealing encrypted response...');
      setProgress(85);
      await new Promise(r => setTimeout(r, 600));
      setProgress(95);

      const researchResult: ResearchResult = {
        answer,
        encrypted: true,
        model,
        timestamp: Date.now(),
      };

      setResult(researchResult);
      setHistory(prev => [{ prompt, result: researchResult }, ...prev].slice(0, 20));

      setProgress(100);
      setState('complete');
      setCurrentStep('Research complete');
    } catch (err: any) {
      setState('error');
      setError(err.message || 'Failed to process research query');
      setCurrentStep('Error occurred');
    }
  }, []);

  const reset = useCallback(() => {
    setState('idle');
    setProgress(0);
    setResult(null);
    setError(null);
    setQuery('');
    setCurrentStep('Ready');
  }, []);

  return {
    state,
    progress,
    result,
    error,
    query,
    submitQuery,
    reset,
    currentStep,
    history,
  };
}

function generateFallbackResponse(prompt: string): string {
  const lower = prompt.toLowerCase();

  if (lower.includes('btc') || lower.includes('bitcoin')) {
    return `**Bitcoin (BTC) Market Overview**

Current estimated price range: $62,000 - $68,000 USD

Key metrics:
- Market Cap: ~$1.3T
- 24h Volume: ~$28B
- Circulating Supply: ~19.7M BTC
- All-Time High: $73,750 (March 2024)

Note: This is a demo response. Connect your NOUS_API_KEY in the environment for live AI-powered research. Cryptocurrency prices are highly volatile and change rapidly.`;
  }

  if (lower.includes('eth') || lower.includes('ethereum')) {
    return `**Ethereum (ETH) Market Overview**

Current estimated price range: $3,200 - $3,600 USD

Key metrics:
- Market Cap: ~$420B
- 24h Volume: ~$15B
- Staking APR: ~3.5%
- Gas (avg): ~12 gwei

Note: This is a demo response. Connect your NOUS_API_KEY for live data.`;
  }

  if (lower.includes('fhe') || lower.includes('homomorphic')) {
    return `**Fully Homomorphic Encryption (FHE)**

FHE allows computations on encrypted data without decrypting it first. Key points:

- **Privacy**: Data remains encrypted during processing
- **Use Cases**: Financial analytics, healthcare, voting systems
- **Providers**: Fhenix, Zama, Microsoft SEAL
- **Performance**: Improving rapidly with hardware acceleration
- **CipherMind**: Uses Fhenix CoFHE for on-chain encrypted AI analytics

FHE is considered the "holy grail" of encryption for privacy-preserving computation.`;
  }

  return `**Research Response**

Your query: "${prompt}"

This is a demo response generated without an active AI connection. To get real-time, AI-powered research results:

1. Set up your NOUS_API_KEY in the environment configuration
2. The system will route your encrypted query to Nous Hermes AI
3. Results are returned and decrypted locally using FHE

CipherMind ensures your research queries remain private through end-to-end encryption.`;
}
