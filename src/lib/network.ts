import { CHAIN_ID } from "./protocol";

/**
 * Plain network facts. Kept free of viem so the pages that only render an
 * address or an explorer link do not drag the whole RPC stack into the bundle.
 */
export const NETWORK = {
  id: CHAIN_ID,
  name: "Robinhood Chain",
  rpcUrl: "https://rpc.mainnet.chain.robinhood.com",
  explorer: "https://robinhoodchain.blockscout.com",
} as const;

export const USDG_ADDRESS = "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168" as const;
export const USDG_DECIMALS = 6;

export function explorerToken(address: string): string {
  return `${NETWORK.explorer}/token/${address}`;
}

export function explorerAddress(address: string): string {
  return `${NETWORK.explorer}/address/${address}`;
}
