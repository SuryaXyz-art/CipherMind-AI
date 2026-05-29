/**
 * Browser CoFHE client for CipherMind.
 *
 * Wraps @cofhe/sdk/web: builds viem public/wallet clients from the injected
 * wallet, connects, and creates a self-permit so the user can encrypt inputs
 * and unseal results that were FHE.allow'd to them.
 */

import { createCofheClient, createCofheConfig } from "@cofhe/sdk/web";
import { getChainById } from "@cofhe/sdk/chains";
import { Encryptable, FheTypes } from "@cofhe/sdk";
import { createPublicClient, createWalletClient, custom } from "viem";
import { arbitrumSepolia } from "viem/chains";
import { ARBITRUM_SEPOLIA_ID } from "./chain";

let clientPromise: Promise<any> | null = null;

function getEthereum(): any {
  const eth = (window as any).ethereum;
  if (!eth) throw new Error("No Ethereum wallet detected. Please install MetaMask.");
  return eth;
}

/** Lazily create + cache the connected CoFHE client (with self-permit). */
export async function getCofheClient(): Promise<any> {
  if (clientPromise) return clientPromise;
  clientPromise = (async () => {
    const ethereum = getEthereum();
    const chain = getChainById(ARBITRUM_SEPOLIA_ID);
    if (!chain) throw new Error("Arbitrum Sepolia is not supported by the installed @cofhe/sdk.");

    const config = createCofheConfig({ environment: "web", supportedChains: [chain] });
    const client = createCofheClient(config);

    const [account] = (await ethereum.request({ method: "eth_requestAccounts" })) as string[];
    const transport = custom(ethereum);
    const publicClient = createPublicClient({ chain: arbitrumSepolia, transport });
    const walletClient = createWalletClient({ account: account as `0x${string}`, chain: arbitrumSepolia, transport });

    // Cast across a viem type-version skew between the app's viem and the one
    // @cofhe/sdk's types were built against; the runtime clients are compatible.
    await client.connect(publicClient as any, walletClient as any);
    await client.permits.createSelf({ issuer: account });
    return client;
  })();
  return clientPromise;
}

/** Drop the cached client (call on account/chain change or disconnect). */
export function resetCofheClient(): void {
  clientPromise = null;
}

/** Encrypt a list of numbers as euint32 InEuint32 inputs ready for a contract call. */
export async function encryptUint32s(values: Array<number | bigint>): Promise<any[]> {
  const client = await getCofheClient();
  return client.encryptInputs(values.map((v) => Encryptable.uint32(BigInt(v)))).execute();
}

/** Unseal a euint32 handle the caller has been granted access to. */
export async function unsealUint32(handle: bigint | string): Promise<number> {
  const client = await getCofheClient();
  const v: bigint = await client.decryptForView(handle, FheTypes.Uint32).withPermit().execute();
  return Number(v);
}

/** Unseal an ebool handle the caller has been granted access to. */
export async function unsealBool(handle: bigint | string): Promise<boolean> {
  const client = await getCofheClient();
  return client.decryptForView(handle, FheTypes.Bool).withPermit().execute();
}
