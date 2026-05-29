/**
 * CipherMind — Wallet Intelligence (on-chain reads, no paid key required).
 *
 * Reads the connected wallet's exposure and active ERC-20 approvals via the
 * existing wallet + public RPC, flags risky (unlimited) allowances, scores
 * risk, and lets the user revoke — a real security action. Whale/rug-pull
 * labelling needs an external data provider and is flagged in the UI.
 */

import { BrowserProvider, Contract, formatEther, MaxUint256 } from "ethers";
import { USDC_ADDRESS, VAULT_ADDRESS, LENDING_ADDRESS } from "./chain";

const ERC20 = [
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
];

async function browser(): Promise<BrowserProvider> {
  const eth = (window as any).ethereum;
  if (!eth) throw new Error("No Ethereum wallet detected.");
  return new BrowserProvider(eth);
}

export interface Portfolio {
  address: string;
  eth: number;
  usdc: number;
}

export async function getPortfolio(): Promise<Portfolio> {
  const p = await browser();
  const addr = await (await p.getSigner()).getAddress();
  const eth = await p.getBalance(addr);
  let usdc = 0n;
  try {
    usdc = await new Contract(USDC_ADDRESS, ERC20, p).balanceOf(addr);
  } catch {
    /* token may not exist on this network */
  }
  return { address: addr, eth: Number(formatEther(eth)), usdc: Number(usdc) };
}

export interface Approval {
  token: string;
  tokenSymbol: string;
  spender: string;
  spenderName: string;
  allowance: string; // human string
  unlimited: boolean;
  isContract: boolean;
}

const KNOWN_SPENDERS = [
  { addr: VAULT_ADDRESS, name: "EncryptedVault" },
  { addr: LENDING_ADDRESS, name: "ConfidentialLending" },
];

/** Scan the wallet's allowances on the known CipherMind token (MockUSDC). */
export async function scanApprovals(): Promise<Approval[]> {
  const p = await browser();
  const owner = await (await p.getSigner()).getAddress();
  const token = new Contract(USDC_ADDRESS, ERC20, p);
  let sym = "mUSDC";
  try { sym = await token.symbol(); } catch { /* keep default */ }

  const out: Approval[] = [];
  for (const s of KNOWN_SPENDERS) {
    if (!s.addr) continue;
    try {
      const a: bigint = await token.allowance(owner, s.addr);
      if (a > 0n) {
        const code = await p.getCode(s.addr);
        const unlimited = a >= MaxUint256 / 2n;
        out.push({
          token: USDC_ADDRESS,
          tokenSymbol: sym,
          spender: s.addr,
          spenderName: s.name,
          allowance: unlimited ? "Unlimited" : a.toString(),
          unlimited,
          isContract: code !== "0x",
        });
      }
    } catch {
      /* skip unreadable pair */
    }
  }
  return out;
}

export interface Risk {
  score: number;
  level: "Low" | "Moderate" | "High";
  notes: string[];
}

export function riskScore(approvals: Approval[]): Risk {
  let score = 100;
  const notes: string[] = [];
  const unlimited = approvals.filter((a) => a.unlimited);
  score -= unlimited.length * 25;
  if (unlimited.length) notes.push(`${unlimited.length} unlimited approval(s) — consider revoking to limit blast radius.`);
  approvals.forEach((a) => {
    if (!a.isContract) notes.push(`Approval to non-contract spender ${a.spender.slice(0, 8)}… is unusual.`);
  });
  if (!approvals.length) notes.push("No active approvals on the tracked token — clean.");
  score = Math.max(0, Math.min(100, score));
  const level = score >= 80 ? "Low" : score >= 50 ? "Moderate" : "High";
  return { score, level, notes };
}

/** Revoke an approval by setting the allowance back to 0 (real on-chain action). */
export async function revokeApproval(spender: string): Promise<void> {
  const p = await browser();
  const token = new Contract(USDC_ADDRESS, ERC20, await p.getSigner());
  await (await token.approve(spender, 0n)).wait();
}

// ── AI wallet risk read (Hermes) ─────────────────────────────────────────────

const NOUS_KEY = import.meta.env.VITE_NOUS_API_KEY as string | undefined;
const NOUS_URL = ((import.meta.env.VITE_NOUS_API_BASE_URL as string) || "https://inference-api.nousresearch.com/v1").replace(/\/$/, "");
const NOUS_MODEL = (import.meta.env.VITE_NOUS_MODEL as string) || "nousresearch/hermes-4-70b";

export async function aiWalletSummary(portfolio: Portfolio, approvals: Approval[], risk: Risk): Promise<string> {
  const ctx =
    `Wallet holds ${portfolio.eth} ETH and ${portfolio.usdc} mUSDC. ` +
    `Active approvals: ${approvals.length ? approvals.map((a) => `${a.tokenSymbol}->${a.spenderName} (${a.allowance})`).join(", ") : "none"}. ` +
    `Heuristic risk: ${risk.level} (${risk.score}/100).`;
  const res = await fetch(`${NOUS_URL}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(NOUS_KEY ? { Authorization: `Bearer ${NOUS_KEY}` } : {}) },
    body: JSON.stringify({
      model: NOUS_MODEL,
      messages: [
        { role: "system", content: "You are CipherMind's Wallet Security Agent. In 3-4 sentences, assess this wallet's approval/exposure risk and give concrete, prioritized actions. No alarmism." },
        { role: "user", content: ctx },
      ],
      temperature: 0.3,
      max_tokens: 240,
    }),
  });
  if (!res.ok) throw new Error(`Nous HTTP ${res.status}`);
  return (await res.json())?.choices?.[0]?.message?.content ?? "No summary available.";
}
