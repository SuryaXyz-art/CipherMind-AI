/**
 * usePayroll — confidential payroll. Employers set encrypted per-employee
 * salaries; employees claim into a private salary balance.
 */

import { useState, useCallback } from "react";
import { encryptUint32s, unsealUint32 } from "../lib/cofhe";
import { getPayrollContract } from "../lib/contracts";

interface ActionState { loading: boolean; message: string | null; error: string | null }
const idle: ActionState = { loading: false, message: null, error: null };

export function usePayroll() {
  const [create, setCreate] = useState<ActionState & { runId: number | null }>({ ...idle, runId: null });
  const [allocate, setAllocate] = useState<ActionState>(idle);
  const [claim, setClaim] = useState<ActionState>(idle);
  const [salary, setSalary] = useState<number | null>(null);
  const [salaryLoading, setSalaryLoading] = useState(false);

  const createRun = useCallback(async (label: string) => {
    setCreate({ loading: true, message: null, error: null, runId: null });
    try {
      const payroll = await getPayrollContract();
      const tx = await payroll.createRun(label || "Payroll");
      await tx.wait();
      const count: bigint = await payroll.runCount();
      const runId = Number(count) - 1;
      setCreate({ loading: false, message: `Run #${runId} created.`, error: null, runId });
    } catch (err: any) {
      setCreate({ loading: false, message: null, error: err?.message || "Create failed", runId: null });
    }
  }, []);

  const setAllocation = useCallback(async (runId: number, employee: string, amount: number) => {
    setAllocate({ loading: true, message: null, error: null });
    try {
      const payroll = await getPayrollContract();
      const enc = await encryptUint32s([Math.round(amount)]);
      await (await payroll.setAllocation(runId, employee, enc[0])).wait();
      setAllocate({ loading: false, message: `Encrypted salary set for ${employee.slice(0, 8)}…`, error: null });
    } catch (err: any) {
      setAllocate({ loading: false, message: null, error: err?.message || "Allocation failed" });
    }
  }, []);

  const claimSalary = useCallback(async (runId: number) => {
    setClaim({ loading: true, message: null, error: null });
    try {
      const payroll = await getPayrollContract();
      await (await payroll.claim(runId)).wait();
      setClaim({ loading: false, message: `Claimed run #${runId}.`, error: null });
    } catch (err: any) {
      setClaim({ loading: false, message: null, error: err?.message || "Claim failed" });
    }
  }, []);

  const revealSalary = useCallback(async () => {
    setSalaryLoading(true);
    try {
      const payroll = await getPayrollContract();
      const handle = await payroll.getEncryptedSalary();
      setSalary(await unsealUint32(handle));
    } catch {
      setSalary(null);
    } finally {
      setSalaryLoading(false);
    }
  }, []);

  return { create, createRun, allocate, setAllocation, claim, claimSalary, salary, salaryLoading, revealSalary };
}
