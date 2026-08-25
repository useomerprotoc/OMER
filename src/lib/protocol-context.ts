import { createContext, useContext } from "react";
import type { ProtocolState } from "./engine";
import type { Identity } from "./identity";

export type PaperTrade = {
  id: string;
  ts: number;
  epoch: number;
  side: "buy" | "sell";
  usdg: number;
  shares: number;
  omer: number;
  price: number;
};

export type Book = {
  /** Paper USDG, only used while no contract is wired up. */
  cash: number;
  shares: number;
  costBasis: number;
  trades: PaperTrade[];
  deltaShares: number;
  deltaReserve: number;
  deltaBuys: number;
  deltaRedeemed: number;
  deltaProtocol: number;
  deltaTax: number;
};

export type Ctx = {
  state: ProtocolState;
  book: Book;
  address: string | null;
  chainOk: boolean;
  connecting: boolean;
  onChain: { eth: number; usdg: number } | null;
  live: boolean;
  identity: Identity | null;
  drawOmer: () => void;
  releaseOmer: () => void;
  connect: () => Promise<void>;
  disconnect: () => void;
  buy: (payGross: number) => void;
  sell: (omerAmount: number) => void;
  resetBook: () => void;
};

export const ProtocolCtx = createContext<Ctx | null>(null);

export function useProtocol(): Ctx {
  const ctx = useContext(ProtocolCtx);
  if (!ctx) throw new Error("useProtocol must be used inside ProtocolProvider");
  return ctx;
}
