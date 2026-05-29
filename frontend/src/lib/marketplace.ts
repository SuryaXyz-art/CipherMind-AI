/**
 * CipherMind — Agent Marketplace.
 *
 * Save, share, and install agent-workflow templates that run on the Hermes
 * Agent Council. Built-in templates ship curated; user templates persist
 * locally; templates can be exported/imported as portable "plugin" codes.
 * Pure client-side, additive — reuses the existing council to execute.
 */

export interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  prompt: string;     // the task handed to the agent council
  builtin?: boolean;
  author?: string;
}

const STORE_KEY = "cm-agent-templates-v1";

export const BUILTIN_TEMPLATES: AgentTemplate[] = [
  {
    id: "builtin-treasury",
    name: "Treasury Rebalance Advisor",
    description: "Council recommends a risk-adjusted treasury rebalance with sizing.",
    prompt: "Given current market risk and my treasury, recommend a rebalance toward stability with concrete sizing and the main risks to watch.",
    builtin: true, author: "CipherMind",
  },
  {
    id: "builtin-lp-audit",
    name: "DeFi Risk Audit",
    description: "Audits a liquidity position for IL, contract, and liquidity risk.",
    prompt: "Audit the risk of providing liquidity to a new token pair I'm considering — cover impermanent loss, smart-contract risk, and liquidity/exit risk, and give a go/no-go.",
    builtin: true, author: "CipherMind",
  },
  {
    id: "builtin-sentiment",
    name: "Sentiment Entry Scout",
    description: "Reads sentiment + momentum and judges entry timing.",
    prompt: "Scan sentiment and momentum for BTC and ETH and tell me whether now is a reasonable entry, with a clear invalidation level.",
    builtin: true, author: "CipherMind",
  },
  {
    id: "builtin-gov",
    name: "Governance Proposal Analyzer",
    description: "Breaks down a DAO proposal's trade-offs and a voting recommendation.",
    prompt: "Analyze a DAO proposal's trade-offs and stakeholder impact, then recommend how I should vote and why.",
    builtin: true, author: "CipherMind",
  },
  {
    id: "builtin-yield",
    name: "Yield Optimizer",
    description: "Finds a risk-adjusted stablecoin yield strategy.",
    prompt: "Find a risk-adjusted yield strategy for my stablecoins, ranking options by risk and calling out the main downside of each.",
    builtin: true, author: "CipherMind",
  },
];

export function loadUserTemplates(): AgentTemplate[] {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? (JSON.parse(raw) as AgentTemplate[]) : [];
  } catch {
    return [];
  }
}

export function saveUserTemplates(list: AgentTemplate[]): void {
  localStorage.setItem(STORE_KEY, JSON.stringify(list));
}

/** Export a template as a portable, paste-able code. */
export function exportTemplate(t: AgentTemplate): string {
  const payload = { name: t.name, description: t.description, prompt: t.prompt, author: t.author || "anon" };
  return btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
}

/** Import a template from an exported code. Throws on malformed input. */
export function importTemplate(code: string): AgentTemplate {
  const obj = JSON.parse(decodeURIComponent(escape(atob(code.trim()))));
  if (!obj?.name || !obj?.prompt) throw new Error("Invalid template code.");
  return {
    id: `user-${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
    name: String(obj.name),
    description: String(obj.description || ""),
    prompt: String(obj.prompt),
    author: String(obj.author || "anon"),
  };
}
