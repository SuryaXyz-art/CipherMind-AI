/**
 * useFHE — React hook for Fhenix Client initialization
 *
 * Manages connection state and provides the FhenixClient instance
 * for encrypting/decrypting data on the frontend.
 */

import { useState, useCallback, useEffect } from 'react';

// Types for FHE state management
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
  encryptValue: (value: number) => Promise<Uint8Array | null>;
}

/**
 * Hook to manage FHE client connection and encryption.
 *
 * In production, this would use @cofhe/sdk/web to create a browser-based
 * CoFHE client. For the demo, we simulate the FHE workflow.
 */
export function useFHE(): UseFHEReturn {
  const [state, setState] = useState<FHEState>({
    isInitialized: false,
    isConnecting: false,
    error: null,
    address: null,
    chainId: null,
  });

  const connect = useCallback(async () => {
    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      // Check for MetaMask/wallet
      if (typeof window === 'undefined' || !(window as any).ethereum) {
        throw new Error('No Ethereum wallet detected. Please install MetaMask.');
      }

      const ethereum = (window as any).ethereum;

      // Request accounts
      const accounts: string[] = await ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found. Please unlock your wallet.');
      }

      // Get chain ID
      const chainIdHex: string = await ethereum.request({
        method: 'eth_chainId',
      });
      const chainId = parseInt(chainIdHex, 16);

      // In production: Initialize CoFHE client here
      // const config = createCofheConfig({
      //   environment: 'browser',
      //   supportedChains: [getChainById(chainId)],
      // });
      // const client = createCofheClient(config);
      // await client.connect(...)

      setState({
        isInitialized: true,
        isConnecting: false,
        error: null,
        address: accounts[0],
        chainId,
      });

      console.log('🔐 FHE Client initialized');
      console.log(`   Address: ${accounts[0]}`);
      console.log(`   Chain:   ${chainId}`);
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: error.message || 'Failed to connect',
      }));
    }
  }, []);

  const disconnect = useCallback(() => {
    setState({
      isInitialized: false,
      isConnecting: false,
      error: null,
      address: null,
      chainId: null,
    });
  }, []);

  /**
   * Encrypt a numeric value using FHE.
   * In production: uses CoFHE SDK encryptInputs
   */
  const encryptValue = useCallback(async (_value: number): Promise<Uint8Array | null> => {
    if (!state.isInitialized) {
      console.error('FHE client not initialized');
      return null;
    }

    // In production:
    // const encrypted = await client.encryptInputs([Encryptable.uint32(BigInt(value))]).execute();
    // return encrypted[0];

    // Demo: simulate encryption delay
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));

    // Return a simulated encrypted payload
    const buffer = new Uint8Array(32);
    crypto.getRandomValues(buffer);
    return buffer;
  }, [state.isInitialized]);

  // Listen for account/chain changes
  useEffect(() => {
    if (typeof window === 'undefined' || !(window as any).ethereum) return;

    const ethereum = (window as any).ethereum;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        setState(prev => ({ ...prev, address: accounts[0] }));
      }
    };

    const handleChainChanged = (chainIdHex: string) => {
      const chainId = parseInt(chainIdHex, 16);
      setState(prev => ({ ...prev, chainId }));
    };

    ethereum.on('accountsChanged', handleAccountsChanged);
    ethereum.on('chainChanged', handleChainChanged);

    return () => {
      ethereum.removeListener('accountsChanged', handleAccountsChanged);
      ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [disconnect]);

  return {
    ...state,
    connect,
    disconnect,
    encryptValue,
  };
}
