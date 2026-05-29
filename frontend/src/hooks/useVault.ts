/**
 * useVault — encrypted balance vault (deposit, private send, balance proof).
 * Amounts are whole USDC (MockUSDC has 0 decimals → fits euint32).
 */

import { useState, useCallback } from "react";
import { encryptUint32s, unsealUint32, unsealBool } from "../lib/cofhe";
import { getVaultContract, getUsdcContract, getSigner } from "../lib/contracts";

interface ActionState {
  loading: boolean;
  message: string | null;
  error: string | null;
}

const idle: ActionState = { loading: false, message: null, error: null };

export function useVault() {
  const [balance, setBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [deposit, setDeposit] = useState<ActionState>(idle);
  const [transfer, setTransfer] = useState<ActionState>(idle);
  const [proof, setProof] = useState<ActionState & { meets: boolean | null; value: number | null }>({
    ...idle,
    meets: null,
    value: null,
  });

  /** Unseal and show the caller's encrypted balance. */
  const refreshBalance = useCallback(async () => {
    setBalanceLoading(true);
    try {
      const vault = await getVaultContract();
      const addr = await (await getSigner()).getAddress();
      if (!(await vault.hasAccount(addr))) {
        setBalance(0);
        return;
      }
      const handle = await vault.getEncryptedBalance();
      setBalance(await unsealUint32(handle));
    } catch {
      setBalance(null);
    } finally {
      setBalanceLoading(false);
    }
  }, []);

  /** Faucet → approve → deposit `amount` whole USDC. */
  const depositFunds = useCallback(async (amount: number) => {
    setDeposit({ loading: true, message: "Minting test USDC…", error: null });
    try {
      const usdc = await getUsdcContract();
      const vault = await getVaultContract();
      const vaultAddr = await vault.getAddress();
      const addr = await (await getSigner()).getAddress();

      const bal: bigint = await usdc.balanceOf(addr);
      if (bal < BigInt(amount)) {
        await (await usdc.faucet(BigInt(amount) - bal)).wait();
      }
      setDeposit({ loading: true, message: "Approving vault…", error: null });
      const allowance: bigint = await usdc.allowance(addr, vaultAddr);
      if (allowance < BigInt(amount)) {
        await (await usdc.approve(vaultAddr, BigInt(amount))).wait();
      }
      setDeposit({ loading: true, message: "Depositing (your balance becomes encrypted)…", error: null });
      await (await vault.deposit(BigInt(amount))).wait();

      setDeposit({ loading: false, message: `Deposited ${amount} USDC into your encrypted balance.`, error: null });
      await refreshBalance();
    } catch (err: any) {
      setDeposit({ loading: false, message: null, error: err?.message || "Deposit failed" });
    }
  }, [refreshBalance]);

  /** Send an encrypted amount to another address. */
  const sendFunds = useCallback(async (to: string, amount: number) => {
    setTransfer({ loading: true, message: "Encrypting amount…", error: null });
    try {
      const vault = await getVaultContract();
      const enc = await encryptUint32s([Math.round(amount)]);
      setTransfer({ loading: true, message: "Submitting private transfer…", error: null });
      await (await vault.send(to, enc[0])).wait();
      setTransfer({ loading: false, message: `Sent an encrypted amount to ${to.slice(0, 8)}…`, error: null });
      await refreshBalance();
    } catch (err: any) {
      setTransfer({ loading: false, message: null, error: err?.message || "Transfer failed" });
    }
  }, [refreshBalance]);

  /** Prove balance ≥ threshold without revealing it. */
  const proveBalance = useCallback(async (threshold: number) => {
    setProof({ loading: true, message: null, error: null, meets: null, value: threshold });
    try {
      const vault = await getVaultContract();
      const enc = await encryptUint32s([Math.round(threshold)]);
      await (await vault.proveBalanceAtLeast(enc[0])).wait();
      const handle = await vault.getBalanceProof();
      const meets = await unsealBool(handle);
      setProof({ loading: false, message: null, error: null, meets, value: threshold });
    } catch (err: any) {
      setProof({ loading: false, message: null, error: err?.message || "Proof failed", meets: null, value: threshold });
    }
  }, []);

  return {
    balance, balanceLoading, refreshBalance,
    deposit, depositFunds,
    transfer, sendFunds,
    proof, proveBalance,
  };
}
