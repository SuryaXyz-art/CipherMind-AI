/**
 * useFHE — wallet connection + CoFHE client lifecycle.
 *
 * Connects the injected wallet, ensures it's on Arbitrum Sepolia, and primes
 * the browser CoFHE client (see lib/cofhe.ts). Encryption/decryption helpers
 * live in lib/cofhe.ts and are used directly by the feature hooks.
 */

import { useState, useCallback, useEffect } from "react";
import { ARBITRUM_SEPOLIA_ID, ARBITRUM_SEPOLIA_PARAMS } from "../lib/chain";
import { getCofheClient, resetCofheClient } from "../lib/cofhe";

interface FHEState {
  isInitialized: boolean;
  isConnecting: boolean;
  error: string | null;
  address: string | null;
  chainId: number | null;
}

interface UseFHEReturn extends FHEState {
  connect: () => Promise<void>;
  disconnect: () => void;
}

async function ensureArbitrumSepolia(ethereum: any): Promise<void> {
  const current = parseInt(await ethereum.request({ method: "eth_chainId" }), 16);
  if (current === ARBITRUM_SEPOLIA_ID) return;
  try {
    await ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: ARBITRUM_SEPOLIA_PARAMS.chainId }],
    });
  } catch (err: any) {
    // 4902 = chain not added yet
    if (err?.code === 4902) {
      await ethereum.request({ method: "wallet_addEthereumChain", params: [ARBITRUM_SEPOLIA_PARAMS] });
    } else {
      throw err;
    }
  }
}

export function useFHE(): UseFHEReturn {
  const [state, setState] = useState<FHEState>({
    isInitialized: false,
    isConnecting: false,
    error: null,
    address: null,
    chainId: null,
  });

  const connect = useCallback(async () => {
    setState((prev) => ({ ...prev, isConnecting: true, error: null }));
    try {
      const ethereum = (window as any).ethereum;
      if (!ethereum) throw new Error("No Ethereum wallet detected. Please install MetaMask.");

      const accounts: string[] = await ethereum.request({ method: "eth_requestAccounts" });
      if (!accounts?.length) throw new Error("No accounts found. Please unlock your wallet.");

      await ensureArbitrumSepolia(ethereum);
      const chainId = parseInt(await ethereum.request({ method: "eth_chainId" }), 16);

      // Prime the CoFHE client (connect + self-permit). Surfaces config errors early.
      await getCofheClient();

      setState({ isInitialized: true, isConnecting: false, error: null, address: accounts[0], chainId });
      console.log("🔐 CoFHE client ready:", accounts[0], "chain", chainId);
    } catch (error: any) {
      resetCofheClient();
      setState((prev) => ({ ...prev, isConnecting: false, error: error?.message || "Failed to connect" }));
    }
  }, []);

  const disconnect = useCallback(() => {
    resetCofheClient();
    setState({ isInitialized: false, isConnecting: false, error: null, address: null, chainId: null });
  }, []);

  useEffect(() => {
    const ethereum = (window as any).ethereum;
    if (!ethereum) return;
    const onAccounts = (accts: string[]) => {
      resetCofheClient();
      if (!accts.length) disconnect();
      else setState((prev) => ({ ...prev, address: accts[0] }));
    };
    const onChain = (hex: string) => {
      resetCofheClient();
      setState((prev) => ({ ...prev, chainId: parseInt(hex, 16) }));
    };
    ethereum.on("accountsChanged", onAccounts);
    ethereum.on("chainChanged", onChain);
    return () => {
      ethereum.removeListener("accountsChanged", onAccounts);
      ethereum.removeListener("chainChanged", onChain);
    };
  }, [disconnect]);

  return { ...state, connect, disconnect };
}
