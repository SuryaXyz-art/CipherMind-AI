/**
 * useRequests — confidential payment requests (public memo, encrypted amount).
 */

import { useState, useCallback } from "react";
import { encryptUint32s, unsealUint32 } from "../lib/cofhe";
import { getRequestsContract } from "../lib/contracts";

interface ActionState { loading: boolean; message: string | null; error: string | null }
const idle: ActionState = { loading: false, message: null, error: null };

export function useRequests() {
  const [create, setCreate] = useState<ActionState & { id: number | null }>({ ...idle, id: null });
  const [payState, setPayState] = useState<ActionState>(idle);
  const [received, setReceived] = useState<number | null>(null);
  const [receivedLoading, setReceivedLoading] = useState(false);

  const createRequest = useCallback(async (amount: number, memo: string) => {
    setCreate({ loading: true, message: null, error: null, id: null });
    try {
      const c = await getRequestsContract();
      const enc = await encryptUint32s([Math.round(amount)]);
      await (await c.createRequest(enc[0], memo || "Payment request")).wait();
      const count: bigint = await c.requestCount();
      const id = Number(count) - 1;
      setCreate({ loading: false, message: `Request #${id} created (amount sealed).`, error: null, id });
    } catch (err: any) {
      setCreate({ loading: false, message: null, error: err?.message || "Create failed", id: null });
    }
  }, []);

  const pay = useCallback(async (id: number) => {
    setPayState({ loading: true, message: null, error: null });
    try {
      const c = await getRequestsContract();
      await (await c.pay(id)).wait();
      setPayState({ loading: false, message: `Paid request #${id}.`, error: null });
    } catch (err: any) {
      setPayState({ loading: false, message: null, error: err?.message || "Pay failed" });
    }
  }, []);

  const revealReceived = useCallback(async () => {
    setReceivedLoading(true);
    try {
      const c = await getRequestsContract();
      setReceived(await unsealUint32(await c.getReceived()));
    } catch {
      setReceived(null);
    } finally {
      setReceivedLoading(false);
    }
  }, []);

  return { create, createRequest, payState, pay, received, receivedLoading, revealReceived };
}
