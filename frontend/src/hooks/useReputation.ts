/**
 * useReputation — private reputation: attest, reveal own score, prove threshold, disclose.
 */

import { useState, useCallback } from "react";
import { encryptUint32s, unsealUint32, unsealBool } from "../lib/cofhe";
import { getReputationContract, getSigner } from "../lib/contracts";

interface ActionState { loading: boolean; message: string | null; error: string | null }
const idle: ActionState = { loading: false, message: null, error: null };

export function useReputation() {
  const [attestState, setAttestState] = useState<ActionState>(idle);
  const [score, setScore] = useState<number | null>(null);
  const [scoreLoading, setScoreLoading] = useState(false);
  const [proof, setProof] = useState<ActionState & { meets: boolean | null; value: number | null }>({ ...idle, meets: null, value: null });
  const [grant, setGrant] = useState<ActionState & { to: string | null }>({ ...idle, to: null });

  const attest = useCallback(async (subject: string, points: number) => {
    setAttestState({ loading: true, message: null, error: null });
    try {
      const c = await getReputationContract();
      const enc = await encryptUint32s([Math.round(points)]);
      await (await c.attest(subject, enc[0])).wait();
      setAttestState({ loading: false, message: `Attested ${points} pts to ${subject.slice(0, 8)}… (encrypted).`, error: null });
    } catch (err: any) {
      setAttestState({ loading: false, message: null, error: err?.message || "Attest failed" });
    }
  }, []);

  const revealScore = useCallback(async () => {
    setScoreLoading(true);
    try {
      const c = await getReputationContract();
      const addr = await (await getSigner()).getAddress();
      if (!(await c.hasReputation(addr))) { setScore(0); return; }
      setScore(await unsealUint32(await c.getReputation()));
    } catch {
      setScore(null);
    } finally {
      setScoreLoading(false);
    }
  }, []);

  const proveAtLeast = useCallback(async (value: number) => {
    setProof({ loading: true, message: null, error: null, meets: null, value });
    try {
      const c = await getReputationContract();
      const enc = await encryptUint32s([Math.round(value)]);
      await (await c.proveAtLeast(enc[0])).wait();
      const meets = await unsealBool(await c.getProof());
      setProof({ loading: false, message: null, error: null, meets, value });
    } catch (err: any) {
      setProof({ loading: false, message: null, error: err?.message || "Proof failed", meets: null, value });
    }
  }, []);

  const grantAccess = useCallback(async (viewer: string) => {
    setGrant({ loading: true, message: null, error: null, to: null });
    try {
      const c = await getReputationContract();
      await (await c.grantAccess(viewer)).wait();
      setGrant({ loading: false, message: null, error: null, to: viewer });
    } catch (err: any) {
      setGrant({ loading: false, message: null, error: err?.message || "Grant failed", to: null });
    }
  }, []);

  return { attestState, attest, score, scoreLoading, revealScore, proof, proveAtLeast, grant, grantAccess };
}
