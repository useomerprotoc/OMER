import { useMemo, useState } from "react";
import { clsx } from "clsx";
import { useProtocol } from "@/lib/protocol-context";
import {
  ETH_USD,
  FEE_RATE,
  quoteBuy,
  quoteSell,
} from "@/lib/protocol";
import { num, pct, usd, usdPrecise } from "@/lib/format";
import { Panel, Row, SystemLabel, Tabs } from "./ui";

type Side = "buy" | "sell";
type Asset = "usdg" | "eth";

const PRESETS = [10, 50, 100, 500];

export function OrderDesk() {
  const {
    state,
    book,
    address,
    connect,
    connecting,
    buy,
    sell,
    onChain,
    live,
    identity,
    drawOmer,
  } = useProtocol();

  // Connecting is only a precondition once the interface points at a real
  // contract. The paper book settles locally, so it needs no wallet at all.

  const [side, setSide] = useState<Side>("buy");
  const [asset, setAsset] = useState<Asset>("usdg");
  const [raw, setRaw] = useState("");

  const typed = Number.parseFloat(raw) || 0;
  const payUsd = side === "buy" && asset === "eth" ? typed * ETH_USD : typed;

  const walletOmer = book.shares * state.index;
  const balance = side === "buy" ? book.cash : walletOmer;

  const quote = useMemo(
    () =>
      side === "buy"
        ? quoteBuy(state.shares, state.index, Math.max(0, payUsd))
        : quoteSell(state.shares, state.index, Math.max(0, typed)),
    [side, state.shares, state.index, payUsd, typed],
  );

  const over = side === "buy" ? payUsd > book.cash : typed > walletOmer + 1e-9;
  const canSubmit = typed > 0 && !over;

  const submit = () => {
    if (!canSubmit) return;
    if (side === "buy") buy(payUsd);
    else sell(typed);
    setRaw("");
  };

  const setPreset = (v: number) => {
    const base = Number.parseFloat(raw) || 0;
    const next = side === "buy" && asset === "eth" ? base + v / ETH_USD : base + v;
    setRaw(String(Number(next.toFixed(6))));
  };

  const unit = side === "buy" ? (asset === "eth" ? "ETH" : "USDG") : "OMER";
  const needsWallet = live && !address;
  // Paper fills are free, but they still belong to somebody: no omer, no book.
  const needsOmer = !live && !identity;

  return (
    <Panel scan className="flex flex-col">
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <SystemLabel>Order desk</SystemLabel>
        <SystemLabel className="text-accent-soft">
          {side === "buy" ? "Buy" : "Sell"}
        </SystemLabel>
      </div>

      <div className="space-y-5 p-5">
        <Tabs
          ariaLabel="Trade direction"
          value={side}
          onChange={(v) => {
            setSide(v);
            setRaw("");
          }}
          options={[
            { value: "buy", label: "Buy OMER" },
            { value: "sell", label: "Sell OMER" },
          ]}
        />

        <div>
          <div className="mb-2 flex items-center justify-between">
            <SystemLabel as="span">
              {side === "buy" ? "You pay" : "You sell"}
            </SystemLabel>
            <span className="system-label text-fg/30">
              {address
                ? onChain
                  ? `Wallet ${num(onChain.usdg, 2)} USDG`
                  : "Reading wallet"
                : identity
                  ? `${identity.handle} · test funds`
                  : "Test balance"}
            </span>
          </div>

          {side === "buy" ? (
            <div className="mb-3 grid grid-cols-2">
              {(["usdg", "eth"] as Asset[]).map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => {
                    setAsset(a);
                    setRaw("");
                  }}
                  className={clsx(
                    "system-label border py-2 transition-colors",
                    asset === a
                      ? "border-fg/30 text-fg"
                      : "border-line text-fg/35 hover:text-fg/60",
                  )}
                >
                  {a}
                </button>
              ))}
            </div>
          ) : null}

          <div
            className={clsx(
              "flex items-center gap-3 border px-4 py-3 transition-colors",
              over ? "border-danger/60" : "border-line focus-within:border-fg/30",
            )}
          >
            <input
              value={raw}
              onChange={(e) => setRaw(e.target.value.replace(/[^0-9.]/g, ""))}
              inputMode="decimal"
              placeholder="0"
              aria-label={side === "buy" ? "Amount to pay" : "Amount to sell"}
              className="num min-w-0 flex-1 bg-transparent text-[24px] text-fg outline-none placeholder:text-fg/20"
            />
            <span className="system-label text-fg/40">{unit}</span>
            <button
              type="button"
              onClick={() =>
                setRaw(
                  String(
                    Number(
                      (side === "buy" && asset === "eth"
                        ? balance / ETH_USD
                        : balance
                      ).toFixed(6),
                    ),
                  ),
                )
              }
              className="system-label border border-line px-2 py-1 text-fg/50 transition-colors hover:border-fg/30 hover:text-fg"
            >
              Max
            </button>
          </div>

          <div className="mt-2 flex items-center justify-between">
            <span className="system-label text-fg/30">
              {side === "buy"
                ? `${num(book.cash, 2)} USDG available`
                : `${num(walletOmer, 6)} OMER held`}
            </span>
            {over ? (
              <span className="system-label text-danger">Exceeds balance</span>
            ) : null}
          </div>

          {side === "buy" ? (
            <div className="mt-3 grid grid-cols-4 gap-2">
              {PRESETS.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setPreset(v)}
                  className="system-label border border-line py-2 text-fg/45 transition-colors hover:border-fg/25 hover:text-fg"
                >
                  +{v}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="border-t border-line pt-4">
          <SystemLabel className="mb-2">
            You receive {side === "buy" ? "(spot)" : "(net of fee)"}
          </SystemLabel>
          <div className="num text-[28px] leading-none text-fg">
            {side === "buy"
              ? `${num(quote.omer, 4)} OMER`
              : usdPrecise(quote.net)}
          </div>
          <div className="system-label mt-2 text-fg/30">
            {side === "buy"
              ? `${num(quote.shares, 6)} shares at ${usdPrecise(state.pricePerShare)} each`
              : `${num(quote.shares, 6)} shares redeemed on the inverse curve`}
          </div>
        </div>

        <div className="divide-y divide-line border-t border-line">
          <Row
            label="Spot / OMER"
            value={usdPrecise(state.pricePerOmer)}
            tone="muted"
          />
          <Row
            label="Effective"
            value={typed > 0 ? usdPrecise(quote.effectivePrice) : "—"}
            tone={typed > 0 ? "down" : "muted"}
          />
          <Row
            label="Curve move"
            value={typed > 0 ? pct(quote.curveMove, 4) : "—"}
            tone="muted"
          />
          <Row
            label="All-in vs spot"
            value={typed > 0 ? pct(quote.priceImpact, 2) : "—"}
            tone="muted"
          />
          <Row
            label="Fee"
            value={`${num(FEE_RATE * 100, 0)}% · ${typed > 0 ? usd(quote.fee, 2) : "—"}`}
            tone="accent"
          />
        </div>

        <button
          type="button"
          onClick={
            needsOmer
              ? drawOmer
              : needsWallet
                ? () => void connect()
                : submit
          }
          disabled={connecting || (!needsOmer && !needsWallet && !canSubmit)}
          className={clsx(
            "btn w-full",
            needsOmer || (!needsWallet && canSubmit) ? "btn-accent" : undefined,
          )}
        >
          {needsOmer
            ? "Draw your omer to trade"
            : needsWallet
              ? connecting
                ? "Connecting"
                : "Connect"
              : side === "buy"
                ? "Buy OMER"
                : "Sell OMER"}
        </button>

        <p className="text-[11px] leading-relaxed text-fg/25">
          Fills are priced off the curve and settle against your own book, which
          lives in this browser. Selling redeems shares on the inverse curve,
          never one dollar per displayed OMER.
        </p>
      </div>
    </Panel>
  );
}
