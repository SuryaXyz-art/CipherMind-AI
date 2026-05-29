/**
 * useGovernance — confidential DAO voting (encrypted votes, public tally on finalize).
 */

import { useState, useCallback } from "react";
import { encryptUint32s, publicUnsealUint32 } from "../lib/cofhe";
import { getGovernanceContract } from "../lib/contracts";

interface ActionState { loading: boolean; message: string | null; error: string | null }
const idle: ActionState = { loading: false, message: null, error: null };

export function useGovernance() {
  const [create, setCreate] = useState<ActionState & { id: number | null }>({ ...idle, id: null });
  const [voteState, setVoteState] = useState<ActionState>(idle);
  const [finalizeState, setFinalizeState] = useState<ActionState>(idle);
  const [tally, setTally] = useState<{ id: number; yes: number; no: number } | null>(null);
  const [tallyLoading, setTallyLoading] = useState(false);

  const createProposal = useCallback(async (title: string) => {
    setCreate({ loading: true, message: null, error: null, id: null });
    try {
      const g = await getGovernanceContract();
      await (await g.createProposal(title || "Proposal")).wait();
      const count: bigint = await g.proposalCount();
      const id = Number(count) - 1;
      setCreate({ loading: false, message: `Proposal #${id} created.`, error: null, id });
    } catch (err: any) {
      setCreate({ loading: false, message: null, error: err?.message || "Create failed", id: null });
    }
  }, []);

  const vote = useCallback(async (id: number, support: boolean) => {
    setVoteState({ loading: true, message: null, error: null });
    try {
      const g = await getGovernanceContract();
      const enc = await encryptUint32s([support ? 1 : 0]);
      await (await g.vote(id, enc[0])).wait();
      setVoteState({ loading: false, message: `Encrypted ${support ? "YES" : "NO"} vote cast on #${id}.`, error: null });
    } catch (err: any) {
      setVoteState({ loading: false, message: null, error: err?.message || "Vote failed" });
    }
  }, []);

  const finalize = useCallback(async (id: number) => {
    setFinalizeState({ loading: true, message: null, error: null });
    try {
      const g = await getGovernanceContract();
      await (await g.finalize(id)).wait();
      setFinalizeState({ loading: false, message: `Proposal #${id} finalized — tally public.`, error: null });
    } catch (err: any) {
      setFinalizeState({ loading: false, message: null, error: err?.message || "Finalize failed" });
    }
  }, []);

  const revealTally = useCallback(async (id: number) => {
    setTallyLoading(true);
    try {
      const g = await getGovernanceContract();
      const [yes, no] = await Promise.all([
        g.getYes(id).then(publicUnsealUint32),
        g.getNo(id).then(publicUnsealUint32),
      ]);
      setTally({ id, yes, no });
    } catch {
      setTally(null);
    } finally {
      setTallyLoading(false);
    }
  }, []);

  return { create, createProposal, voteState, vote, finalizeState, finalize, tally, tallyLoading, revealTally };
}
