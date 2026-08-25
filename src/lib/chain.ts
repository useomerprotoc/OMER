import { createPublicClient, defineChain, http, formatUnits } from "viem";
import { NETWORK, USDG_ADDRESS, USDG_DECIMALS } from "./network";

/**
 * Robinhood Chain reads. Public RPC, no key, no account.
 *
 * This module is loaded on demand from the wallet flow so viem stays out of the
 * first paint.
 */
export const robinhoodChain = defineChain({
  id: NETWORK.id,
  name: NETWORK.name,
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: [NETWORK.rpcUrl] } },
  blockExplorers: {
    default: { name: "Blockscout", url: NETWORK.explorer },
  },
});

export const publicClient = createPublicClient({
  chain: robinhoodChain,
  transport: http(undefined, { batch: { wait: 20 }, retryCount: 2 }),
});

const ERC20_BALANCE_ABI = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

export async function readBalances(address: `0x${string}`) {
  const [eth, usdg] = await Promise.all([
    publicClient.getBalance({ address }),
    publicClient.readContract({
      address: USDG_ADDRESS,
      abi: ERC20_BALANCE_ABI,
      functionName: "balanceOf",
      args: [address],
    }),
  ]);

  return {
    eth: Number(formatUnits(eth, 18)),
    usdg: Number(formatUnits(usdg, USDG_DECIMALS)),
  };
}
