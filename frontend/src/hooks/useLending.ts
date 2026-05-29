/**
 * useLending — confidential lending. Deposit collateral, borrow within 75% LTV,
 * repay, and read your encrypted position / health.
 */

import { useState, useCallback } from "react";
import { encryptUint32s, unsealUint32, unsealBool } from "../lib/cofhe";
import { getLendingContract, getUsdcContract, getSigner } from "../lib/contracts";

interface ActionState { loading: boolean; message: string | null; error: string | null }
const idle: ActionState = { loading: false, message: null, error: null };

export function useLending() {
  const [position, setPosition] = useState<{ collateral: number; debt: number; borrowable: number } | null>(null);
  const [posLoading, setPosLoading] = useState(false);
  const [health, setHealth] = useState<boolean | null>(null);
  const [deposit, setDeposit] = useState<ActionState>(idle);
  const [loan, setLoan] = useState<ActionState>(idle);

  const refresh = useCallback(async () => {
    setPosLoading(true);
    try {
      const lending = await getLendingContract();
      const addr = await (await getSigner()).getAddress();
      if (!(await lending.hasPosition(addr))) {
        setPosition({ collateral: 0, debt: 0, borrowable: 0 });
        return;
      }
      const [c, d, b] = await Promise.all([
        lending.getEncryptedCollateral().then(unsealUint32),
        lending.getEncryptedDebt().then(unsealUint32),
        lending.getEncryptedBorrowable().then(unsealUint32),
      ]);
      setPosition({ collateral: c, debt: d, borrowable: b });
    } catch {
      setPosition(null);
    } finally {
      setPosLoading(false);
    }
  }, []);

  const depositCollateral = useCallback(async (amount: number) => {
    setDeposit({ loading: true, message: "Minting + approving USDC…", error: null });
    try {
      const usdc = await getUsdcContract();
      const lending = await getLendingContract();
      const lendingAddr = await lending.getAddress();
      const addr = await (await getSigner()).getAddress();

      const bal: bigint = await usdc.balanceOf(addr);
      if (bal < BigInt(amount)) await (await usdc.faucet(BigInt(amount) - bal)).wait();
      const allowance: bigint = await usdc.allowance(addr, lendingAddr);
      if (allowance < BigInt(amount)) await (await usdc.approve(lendingAddr, BigInt(amount))).wait();

      setDeposit({ loading: true, message: "Depositing collateral (encrypted)…", error: null });
      await (await lending.depositCollateral(BigInt(amount))).wait();
      setDeposit({ loading: false, message: `Deposited ${amount} USDC collateral.`, error: null });
      await refresh();
    } catch (err: any) {
      setDeposit({ loading: false, message: null, error: err?.message || "Deposit failed" });
    }
  }, [refresh]);

  const borrow = useCallback(async (amount: number) => {
    setLoan({ loading: true, message: "Encrypting + borrowing…", error: null });
    try {
      const lending = await getLendingContract();
      const enc = await encryptUint32s([Math.round(amount)]);
      await (await lending.borrow(enc[0])).wait();
      setLoan({ loading: false, message: "Borrow submitted (0 drawn if it would exceed 75% LTV).", error: null });
      await refresh();
    } catch (err: any) {
      setLoan({ loading: false, message: null, error: err?.message || "Borrow failed" });
    }
  }, [refresh]);

  const repay = useCallback(async (amount: number) => {
    setLoan({ loading: true, message: "Encrypting + repaying…", error: null });
    try {
      const lending = await getLendingContract();
      const enc = await encryptUint32s([Math.round(amount)]);
      await (await lending.repay(enc[0])).wait();
      setLoan({ loading: false, message: "Repayment submitted.", error: null });
      await refresh();
    } catch (err: any) {
      setLoan({ loading: false, message: null, error: err?.message || "Repay failed" });
    }
  }, [refresh]);

  const checkHealth = useCallback(async () => {
    try {
      const lending = await getLendingContract();
      await (await lending.checkHealth()).wait();
      const h = await lending.getHealth();
      setHealth(await unsealBool(h));
    } catch {
      setHealth(null);
    }
  }, []);

  return { position, posLoading, refresh, health, deposit, depositCollateral, loan, borrow, repay, checkHealth };
}
