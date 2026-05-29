/**
 * Chain + deployment configuration for the CipherMind frontend.
 * Contract addresses come from Vite env (set in frontend/.env after deploying).
 */

export const ARBITRUM_SEPOLIA_ID = 421614;

export const ARBITRUM_SEPOLIA_PARAMS = {
  chainId: "0x66eee", // 421614
  chainName: "Arbitrum Sepolia",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: ["https://sepolia-rollup.arbitrum.io/rpc"],
  blockExplorerUrls: ["https://sepolia.arbiscan.io"],
};

export const CREDIT_ADDRESS = (import.meta.env.VITE_CREDIT_ADDRESS as string) || "";
export const TRADING_ADDRESS = (import.meta.env.VITE_TRADING_ADDRESS as string) || "";
export const VAULT_ADDRESS = (import.meta.env.VITE_VAULT_ADDRESS as string) || "";
export const USDC_ADDRESS = (import.meta.env.VITE_USDC_ADDRESS as string) || "";
export const PAYROLL_ADDRESS = (import.meta.env.VITE_PAYROLL_ADDRESS as string) || "";
export const LENDING_ADDRESS = (import.meta.env.VITE_LENDING_ADDRESS as string) || "";
export const REQUESTS_ADDRESS = (import.meta.env.VITE_REQUESTS_ADDRESS as string) || "";
export const CROWDFUND_ADDRESS = (import.meta.env.VITE_CROWDFUND_ADDRESS as string) || "";
export const ESCROW_ADDRESS = (import.meta.env.VITE_ESCROW_ADDRESS as string) || "";

export function requireAddress(addr: string, name: string): string {
  if (!addr) {
    throw new Error(
      `${name} address not configured. Set VITE_CREDIT_ADDRESS / VITE_TRADING_ADDRESS in frontend/.env after deploying.`,
    );
  }
  return addr;
}
