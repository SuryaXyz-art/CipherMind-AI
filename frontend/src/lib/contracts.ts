/** ethers contract handles for the CipherMind contracts (browser wallet signer). */

import { BrowserProvider, Contract, type Signer } from "ethers";
import { CREDIT_ABI, TRADING_ABI } from "./abis";
import { CREDIT_ADDRESS, TRADING_ADDRESS, requireAddress } from "./chain";

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

/** Poll a predicate until true or timeout — used to await oracle fulfillment. */
export async function pollUntil(
  check: () => Promise<boolean>,
  { timeoutMs = 120000, intervalMs = 4000 }: { timeoutMs?: number; intervalMs?: number } = {},
): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await check()) return true;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return false;
}
