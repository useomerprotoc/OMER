import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { computeState, type ProtocolState } from "./engine";
import { ProtocolCtx, type Book, type Ctx } from "./protocol-context";
import {
  clearIdentity,
  drawIdentity,
  loadIdentity,
  type Identity,
} from "./identity";
import {
  CHAIN_ID,
  CURVE_A,
  FEE_RATE,
  FEE_TO_PROTOCOL,
  FEE_TO_RESERVE,
  IS_LIVE,
  REBASE_RATE,
  curveIntegral,
  pricePerShare,
} from "./protocol";

type Eip1193 = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

declare global {
  interface Window {
    ethereum?: Eip1193;
  }
}

const EMPTY_BOOK: Book = {
  cash: 5000,
  shares: 0,
  costBasis: 0,
  trades: [],
  deltaShares: 0,
  deltaReserve: 0,
  deltaBuys: 0,
  deltaRedeemed: 0,
  deltaProtocol: 0,
  deltaTax: 0,
};

const STORAGE_KEY = "omer.book.v1";

function loadBook(): Book {
  if (typeof window === "undefined") return EMPTY_BOOK;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_BOOK;
    return { ...EMPTY_BOOK, ...(JSON.parse(raw) as Partial<Book>) };
  } catch {
    return EMPTY_BOOK;
  }
}

function saveBook(book: Book) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(book));
  } catch {
    /* private mode, nothing to persist */
  }
}

/** Fold the local book into the public numbers so a paper fill moves the curve. */
function applyBook(state: ProtocolState, book: Book): ProtocolState {
  if (book.deltaShares === 0 && book.deltaReserve === 0) return state;

  const shares = Math.max(1, state.shares + book.deltaShares);
  const reserve = Math.max(0, state.reserve + book.deltaReserve);
  const backing = curveIntegral(shares);
  const price = pricePerShare(shares);

  return {
    ...state,
    shares,
    peakShares: Math.max(state.peakShares, shares),
    supply: shares * state.index,
    reserve,
    liquid: reserve - state.vault,
    requiredLiquid: reserve * 0.5,
    withdrawable: reserve,
    backing,
    surplus: reserve - backing,
    pricePerShare: price,
    pricePerOmer: price / state.index,
    reservePerShare: reserve / shares,
    change24h: price / state.index / state.price24hAgo - 1,
    buyDeposits: state.buyDeposits + book.deltaBuys,
    redeemed: state.redeemed + book.deltaRedeemed,
    protocolFees: state.protocolFees + book.deltaProtocol,
    taxRetained: state.taxRetained + book.deltaTax,
    newOmerThisEpoch: shares * state.index * REBASE_RATE,
  };
}

export function ProtocolProvider({ children }: { children: ReactNode }) {
  const [now, setNow] = useState(() => Date.now());
  const [book, setBook] = useState<Book>(loadBook);
  const [identity, setIdentity] = useState<Identity | null>(loadIdentity);
  const [address, setAddress] = useState<string | null>(null);
  const [chainOk, setChainOk] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [onChain, setOnChain] = useState<{ eth: number; usdg: number } | null>(
    null,
  );
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      mounted.current = false;
      window.clearInterval(id);
    };
  }, []);

  useEffect(() => {
    saveBook(book);
  }, [book]);

  const state = useMemo(() => applyBook(computeState(now), book), [now, book]);

  const refreshBalances = useCallback(async (addr: string) => {
    try {
      // viem only loads once someone actually connects a wallet.
      const { readBalances } = await import("./chain");
      const balances = await readBalances(addr as `0x${string}`);
      if (mounted.current) setOnChain(balances);
    } catch {
      if (mounted.current) setOnChain(null);
    }
  }, []);

  const connect = useCallback(async () => {
    const provider = window.ethereum;
    if (!provider) {
      window.open("https://metamask.io/download/", "_blank", "noopener");
      return;
    }
    setConnecting(true);
    try {
      const accounts = (await provider.request({
        method: "eth_requestAccounts",
      })) as string[];
      const addr = accounts?.[0] ?? null;
      setAddress(addr);

      const hexChain = (await provider.request({
        method: "eth_chainId",
      })) as string;
      setChainOk(parseInt(hexChain, 16) === CHAIN_ID);

      if (addr) void refreshBalances(addr);
    } catch {
      /* the user declined the prompt */
    } finally {
      setConnecting(false);
    }
  }, [refreshBalances]);

  const disconnect = useCallback(() => {
    setAddress(null);
    setOnChain(null);
    setChainOk(false);
  }, []);

  const buy = useCallback((payGross: number) => {
    if (!(payGross > 0)) return;
    setBook((prev) => {
      const cash = Math.min(prev.cash, payGross);
      if (cash <= 0) return prev;

      const live = computeState(Date.now());
      const s = Math.max(1, live.shares + prev.deltaShares);
      const fee = cash * FEE_RATE;
      const net = cash - fee;
      const ds = Math.sqrt(s * s + (2 * net) / CURVE_A) - s;
      const omer = ds * live.index;

      return {
        ...prev,
        cash: prev.cash - cash,
        shares: prev.shares + ds,
        costBasis: prev.costBasis + cash,
        deltaShares: prev.deltaShares + ds,
        deltaReserve: prev.deltaReserve + net + fee * FEE_TO_RESERVE,
        deltaBuys: prev.deltaBuys + cash,
        deltaProtocol: prev.deltaProtocol + fee * FEE_TO_PROTOCOL,
        deltaTax: prev.deltaTax + fee * FEE_TO_RESERVE,
        trades: [
          {
            id: `${Date.now()}-b`,
            ts: Date.now(),
            epoch: live.epoch,
            side: "buy" as const,
            usdg: cash,
            shares: ds,
            omer,
            price: cash / omer,
          },
          ...prev.trades,
        ].slice(0, 60),
      };
    });
  }, []);

  const sell = useCallback((omerAmount: number) => {
    if (!(omerAmount > 0)) return;
    setBook((prev) => {
      const live = computeState(Date.now());
      const s = Math.max(1, live.shares + prev.deltaShares);
      const ds = Math.min(prev.shares, omerAmount / live.index);
      if (ds <= 0) return prev;

      const gross = curveIntegral(s) - curveIntegral(Math.max(0, s - ds));
      const fee = gross * FEE_RATE;
      const net = gross - fee;
      const soldOmer = ds * live.index;
      const basisOut = prev.shares > 0 ? (prev.costBasis * ds) / prev.shares : 0;

      return {
        ...prev,
        cash: prev.cash + net,
        shares: prev.shares - ds,
        costBasis: Math.max(0, prev.costBasis - basisOut),
        deltaShares: prev.deltaShares - ds,
        deltaReserve: prev.deltaReserve - (gross - fee * FEE_TO_RESERVE),
        deltaRedeemed: prev.deltaRedeemed + net,
        deltaProtocol: prev.deltaProtocol + fee * FEE_TO_PROTOCOL,
        deltaTax: prev.deltaTax + fee * FEE_TO_RESERVE,
        trades: [
          {
            id: `${Date.now()}-s`,
            ts: Date.now(),
            epoch: live.epoch,
            side: "sell" as const,
            usdg: net,
            shares: ds,
            omer: soldOmer,
            price: net / soldOmer,
          },
          ...prev.trades,
        ].slice(0, 60),
      };
    });
  }, []);

  const resetBook = useCallback(() => setBook(EMPTY_BOOK), []);

  /** One omer per person: draw once, and the handle is yours from that epoch. */
  const drawOmer = useCallback(() => {
    setIdentity((prev) => prev ?? drawIdentity(computeState(Date.now()).epoch));
  }, []);

  const releaseOmer = useCallback(() => {
    clearIdentity();
    setIdentity(null);
    setBook(EMPTY_BOOK);
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      state,
      book,
      address,
      chainOk,
      connecting,
      onChain,
      live: IS_LIVE,
      identity,
      drawOmer,
      releaseOmer,
      connect,
      disconnect,
      buy,
      sell,
      resetBook,
    }),
    [
      state,
      book,
      address,
      chainOk,
      connecting,
      onChain,
      identity,
      drawOmer,
      releaseOmer,
      connect,
      disconnect,
      buy,
      sell,
      resetBook,
    ],
  );

  return <ProtocolCtx.Provider value={value}>{children}</ProtocolCtx.Provider>;
}
