/**
 * useWalletIntel — drives on-chain wallet analytics (portfolio, approvals, risk).
 */

import { useState, useCallback } from "react";
import {
  getPortfolio, scanApprovals, riskScore, revokeApproval, aiWalletSummary,
  type Portfolio, type Approval, type Risk,
} from "../lib/walletIntel";

export function useWalletIntel() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [risk, setRisk] = useState<Risk | null>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const scan = useCallback(async () => {
    setScanning(true);
    setError(null);
    setSummary(null);
    try {
      const [p, a] = await Promise.all([getPortfolio(), scanApprovals()]);
      setPortfolio(p);
      setApprovals(a);
      setRisk(riskScore(a));
    } catch (e: any) {
      setError(e?.message || "Scan failed");
    } finally {
      setScanning(false);
    }
  }, []);

  const revoke = useCallback(async (spender: string) => {
    setRevoking(spender);
    setError(null);
    try {
      await revokeApproval(spender);
      // rescan to reflect the change
      const a = await scanApprovals();
      setApprovals(a);
      setRisk(riskScore(a));
    } catch (e: any) {
      setError(e?.message || "Revoke failed");
    } finally {
      setRevoking(null);
    }
  }, []);

  const generateSummary = useCallback(async () => {
    if (!portfolio || !risk) return;
    setSummaryLoading(true);
    try {
      setSummary(await aiWalletSummary(portfolio, approvals, risk));
    } catch (e: any) {
      setSummary(`AI summary unavailable: ${e?.message || e}`);
    } finally {
      setSummaryLoading(false);
    }
  }, [portfolio, approvals, risk]);

  return { portfolio, approvals, risk, scanning, error, revoking, summary, summaryLoading, scan, revoke, generateSummary };
}
