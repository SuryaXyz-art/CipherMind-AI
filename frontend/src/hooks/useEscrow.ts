/**
 * useEscrow — confidential 2-of-2 + arbiter escrow over an encrypted amount.
 */

import { useState, useCallback } from "react";
import { encryptUint32s, unsealUint32 } from "../lib/cofhe";
import { getEscrowContract } from "../lib/contracts";

interface ActionState { loading: boolean; message: string | null; error: string | null }
const idle: ActionState = { loading: false, message: null, error: null };

export function useEscrow() {
  const [open, setOpen] = useState<ActionState & { id: number | null }>({ ...idle, id: null });
  const [action, setAction] = useState<ActionState>(idle);
  const [balance, setBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

  const openDeal = useCallback(async (seller: string, arbiter: string, amount: number, memo: string) => {
    setOpen({ loading: true, message: null, error: null, id: null });
    try {
      const c = await getEscrowContract();
      const enc = await encryptUint32s([Math.round(amount)]);
      await (await c.openDeal(seller, arbiter, enc[0], memo || "Escrow deal")).wait();
      const count: bigint = await c.dealCount();
      const id = Number(count) - 1;
      setOpen({ loading: false, message: `Deal #${id} opened (amount sealed).`, error: null, id });
    } catch (err: any) {
      setOpen({ loading: false, message: null, error: err?.message || "Open failed", id: null });
    }
  }, []);

  const approve = useCallback(async (id: number) => {
    setAction({ loading: true, message: null, error: null });
    try {
      const c = await getEscrowContract();
      await (await c.approve(id)).wait();
      setAction({ loading: false, message: `Approved deal #${id}.`, error: null });
    } catch (err: any) {
      setAction({ loading: false, message: null, error: err?.message || "Approve failed" });
    }
  }, []);

  const resolve = useCallback(async (id: number, releaseToSeller: boolean) => {
    setAction({ loading: true, message: null, error: null });
    try {
      const c = await getEscrowContract();
      await (await c.resolve(id, releaseToSeller)).wait();
      setAction({ loading: false, message: `Arbiter ${releaseToSeller ? "released" : "refunded"} deal #${id}.`, error: null });
    } catch (err: any) {
      setAction({ loading: false, message: null, error: err?.message || "Resolve failed" });
    }
  }, []);

  const revealBalance = useCallback(async () => {
    setBalanceLoading(true);
    try {
      const c = await getEscrowContract();
      setBalance(await unsealUint32(await c.getBalance()));
    } catch {
      setBalance(null);
    } finally {
      setBalanceLoading(false);
    }
  }, []);

  return { open, openDeal, action, approve, resolve, balance, balanceLoading, revealBalance };
}
