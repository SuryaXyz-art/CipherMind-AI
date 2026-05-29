/**
 * useCrowdfund — raise toward an encrypted goal with private contributions.
 */

import { useState, useCallback } from "react";
import { encryptUint32s, unsealUint32, unsealBool } from "../lib/cofhe";
import { getCrowdfundContract } from "../lib/contracts";

interface ActionState { loading: boolean; message: string | null; error: string | null }
const idle: ActionState = { loading: false, message: null, error: null };

export function useCrowdfund() {
  const [create, setCreate] = useState<ActionState & { id: number | null }>({ ...idle, id: null });
  const [contributeState, setContributeState] = useState<ActionState>(idle);
  const [raised, setRaised] = useState<number | null>(null);
  const [reached, setReached] = useState<boolean | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  const createCampaign = useCallback(async (goal: number, title: string) => {
    setCreate({ loading: true, message: null, error: null, id: null });
    try {
      const c = await getCrowdfundContract();
      const enc = await encryptUint32s([Math.round(goal)]);
      await (await c.createCampaign(enc[0], title || "Campaign")).wait();
      const count: bigint = await c.campaignCount();
      const id = Number(count) - 1;
      setCreate({ loading: false, message: `Campaign #${id} created (goal sealed).`, error: null, id });
    } catch (err: any) {
      setCreate({ loading: false, message: null, error: err?.message || "Create failed", id: null });
    }
  }, []);

  const contribute = useCallback(async (id: number, amount: number) => {
    setContributeState({ loading: true, message: null, error: null });
    try {
      const c = await getCrowdfundContract();
      const enc = await encryptUint32s([Math.round(amount)]);
      await (await c.contribute(id, enc[0])).wait();
      setContributeState({ loading: false, message: `Contributed to #${id} (amount sealed).`, error: null });
    } catch (err: any) {
      setContributeState({ loading: false, message: null, error: err?.message || "Contribute failed" });
    }
  }, []);

  // Owner-only: reveal raised total + goal-reached.
  const revealProgress = useCallback(async (id: number) => {
    setViewLoading(true);
    try {
      const c = await getCrowdfundContract();
      await (await c.checkGoalReached(id)).wait();
      setRaised(await unsealUint32(await c.getRaised(id)));
      setReached(await unsealBool(await c.getGoalReached(id)));
    } catch {
      setRaised(null);
      setReached(null);
    } finally {
      setViewLoading(false);
    }
  }, []);

  return { create, createCampaign, contributeState, contribute, raised, reached, viewLoading, revealProgress };
}
