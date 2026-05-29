/** ethers contract handles for the CipherMind contracts (browser wallet signer). */

import { BrowserProvider, Contract, type Signer } from "ethers";
import { CREDIT_ABI, TRADING_ABI, VAULT_ABI, USDC_ABI, PAYROLL_ABI, LENDING_ABI, REQUESTS_ABI, CROWDFUND_ABI, ESCROW_ABI, GOVERNANCE_ABI, REPUTATION_ABI } from "./abis";
import {
  CREDIT_ADDRESS, TRADING_ADDRESS, VAULT_ADDRESS, USDC_ADDRESS,
  PAYROLL_ADDRESS, LENDING_ADDRESS, REQUESTS_ADDRESS, CROWDFUND_ADDRESS, ESCROW_ADDRESS, GOVERNANCE_ADDRESS, REPUTATION_ADDRESS, requireAddress,
} from "./chain";

export async function getSigner(): Promise<Signer> {
  const ethereum = (window as any).ethereum;
  if (!ethereum) throw new Error("No Ethereum wallet detected. Please install MetaMask.");
  const provider = new BrowserProvider(ethereum);
  return provider.getSigner();
}

export async function getCreditContract(): Promise<Contract> {
  const signer = await getSigner();
  return new Contract(requireAddress(CREDIT_ADDRESS, "Credit"), CREDIT_ABI, signer);
}

export async function getTradingContract(): Promise<Contract> {
  const signer = await getSigner();
  return new Contract(requireAddress(TRADING_ADDRESS, "Trading"), TRADING_ABI, signer);
}

export async function getVaultContract(): Promise<Contract> {
  const signer = await getSigner();
  return new Contract(requireAddress(VAULT_ADDRESS, "Vault"), VAULT_ABI, signer);
}

export async function getUsdcContract(): Promise<Contract> {
  const signer = await getSigner();
  return new Contract(requireAddress(USDC_ADDRESS, "USDC"), USDC_ABI, signer);
}

export async function getPayrollContract(): Promise<Contract> {
  const signer = await getSigner();
  return new Contract(requireAddress(PAYROLL_ADDRESS, "Payroll"), PAYROLL_ABI, signer);
}

export async function getLendingContract(): Promise<Contract> {
  const signer = await getSigner();
  return new Contract(requireAddress(LENDING_ADDRESS, "Lending"), LENDING_ABI, signer);
}

export async function getRequestsContract(): Promise<Contract> {
  const signer = await getSigner();
  return new Contract(requireAddress(REQUESTS_ADDRESS, "PaymentRequests"), REQUESTS_ABI, signer);
}

export async function getCrowdfundContract(): Promise<Contract> {
  const signer = await getSigner();
  return new Contract(requireAddress(CROWDFUND_ADDRESS, "Crowdfund"), CROWDFUND_ABI, signer);
}

export async function getEscrowContract(): Promise<Contract> {
  const signer = await getSigner();
  return new Contract(requireAddress(ESCROW_ADDRESS, "Escrow"), ESCROW_ABI, signer);
}

export async function getGovernanceContract(): Promise<Contract> {
  const signer = await getSigner();
  return new Contract(requireAddress(GOVERNANCE_ADDRESS, "Governance"), GOVERNANCE_ABI, signer);
}

export async function getReputationContract(): Promise<Contract> {
  const signer = await getSigner();
  return new Contract(requireAddress(REPUTATION_ADDRESS, "Reputation"), REPUTATION_ABI, signer);
}

/** Poll a predicate until true or timeout — used to await oracle fulfillment. */
export async function pollUntil(
  check: () => Promise<boolean>,
  {
    timeoutMs = 90000,
    intervalMs = 4000,
    onWait,
  }: { timeoutMs?: number; intervalMs?: number; onWait?: (elapsedMs: number) => void } = {},
): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await check()) return true;
    onWait?.(Date.now() - start);
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return false;
}

/** Message shown when the oracle never fulfills (the usual "it just spins" cause). */
export const ORACLE_TIMEOUT_MESSAGE =
  "No response from the oracle. The encrypted request was submitted on-chain, but the oracle service must be running to process it. Start it in a terminal with `npm run oracle` (keep it open), then try again.";
