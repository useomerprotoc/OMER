import { Link } from "react-router-dom";
import { useProtocol } from "@/lib/protocol-context";
import {
  APY_PERCENT,
  EPOCH_SECONDS,
  IS_LIVE,
  LIQUID_FLOOR,
  REBASE_RATE,
} from "@/lib/protocol";
import { clock, compact, num, pct, usd, usdPrecise } from "@/lib/format";
import { Stat, SystemLabel } from "./ui";
import { TBA, pctFineT, usdPreciseT, usdT } from "@/lib/tba";


export function KeyFigures() {
  const { state } = useProtocol();

  return (
    <div className="grid border-y border-line sm:grid-cols-3">
      <figure className="border-line px-6 py-7 sm:border-r">
        <SystemLabel className="mb-3">
          {IS_LIVE ? "Price" : "Launch price"}
        </SystemLabel>
        <div className="num text-[30px] leading-none">
          {usdPreciseT(state.pricePerOmer)}
        </div>
        {IS_LIVE ? (
          <div
            className={
              "system-label mt-3 " +
              (state.change24h >= 0 ? "text-success" : "text-danger")
            }
          >
            {pct(state.change24h, 2)} / 24h
          </div>
        ) : (
          <div className="system-label mt-3 text-fg/35">
            announced at deployment
          </div>
        )}
      </figure>

      <figure className="border-t border-line px-6 py-7 sm:border-t-0 sm:border-r">
        <SystemLabel className="mb-3">Rebase</SystemLabel>
        <div className="num text-[30px] leading-none text-accent-soft">
          {pctFineT(REBASE_RATE)}
        </div>
        <div className="system-label mt-3 text-fg/35">
          {IS_LIVE
            ? `${EPOCH_SECONDS / 60} min · ${num(APY_PERCENT, 0)}%`
            : "per epoch, set at deployment"}
        </div>
      </figure>

      <figure className="border-t border-line px-6 py-7 sm:border-t-0">
        <SystemLabel className="mb-3">
          {IS_LIVE ? "Next" : "Epoch"}
        </SystemLabel>
        <div className="num text-[30px] leading-none">
          {IS_LIVE ? clock(state.secondsToNext) : TBA}
        </div>
        <div className="system-label mt-3 text-fg/35">
          {IS_LIVE ? `Epoch ${num(state.epoch, 0)}` : "epoch length"}
        </div>
      </figure>
    </div>
  );
}

export function ReserveBanner() {
  const { state } = useProtocol();

  return (
    <Link
      to="/reserve"
      className="group flex flex-col gap-4 border-b border-line px-6 py-7 transition-colors hover:bg-white/[0.015] sm:flex-row sm:items-end sm:justify-between lg:px-10"
    >
      <div>
        <div className="num text-[34px] leading-none">{usdT(state.reserve)}</div>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
          <SystemLabel as="span" className="text-fg/50">
            {IS_LIVE ? "in the Reserve" : "in the Reserve at launch"}
          </SystemLabel>
          <SystemLabel as="span" className="text-fg/25">
            · {usdT(state.surplus)} surplus above the curve
          </SystemLabel>
        </div>
      </div>
      <span className="system-label text-fg/40 transition-colors group-hover:text-accent-soft">
        The Reserve →
      </span>
    </Link>
  );
}

export function MetricGrid() {
  const { state } = useProtocol();

  type Metric = {
    label: string;
    value: string;
    sub: string;
    tone?: "accent" | "up" | "down";
    /** Only meaningful once there is order flow to report. */
    live?: boolean;
  };

  const metrics: Metric[] = ([
    {
      label: "Reserve",
      value: usd(state.reserve),
      sub: "Liquid USDG plus vault NAV. One pot.",
    },
    {
      label: "Liquid USDG",
      value: usd(state.liquid),
      sub: "Sitting on the Reserve, not in the vault.",
    },
    {
      label: "Earning",
      value: usd(state.vault),
      sub: "Reserve USDG in the sealed vault. NAV, not cash today.",
    },
    {
      label: "Withdrawable",
      value: usd(state.withdrawable),
      sub: "Liquid USDG plus what the vault returns now.",
    },
    {
      label: "Required liquid",
      value: usd(state.requiredLiquid),
      sub: `At least ${LIQUID_FLOOR * 100}% of the Reserve stays liquid USDG.`,
    },
    {
      label: "Curve backing",
      value: usd(state.backing),
      sub: "What the curve owes if every share redeems today.",
    },
    {
      label: "Surplus",
      value: usd(state.surplus),
      sub: "Reserve above what the book has already spoken for.",
      tone: state.surplus >= 0 ? "up" : "down",
    },
    {
      label: "Vault yield",
      value: usd(state.vaultYield, 2),
      sub: "Earned by idle Reserve USDG. Stays in the Reserve.",
    },
    {
      label: "New OMER this epoch",
      value: `${num(state.newOmerThisEpoch, 4)}`,
      sub: "Displayed OMER minted by the index. No USDG is paid out.",
      tone: "accent",
    },
    {
      label: "Tax retained",
      value: usd(state.taxRetained),
      sub: "Buy and sell fees kept on the hook.",
    },
    {
      label: "Buy deposits",
      value: usd(state.buyDeposits),
      sub: "USDG that entered from buyers.",
    },
    {
      label: "Redeemed",
      value: usd(state.redeemed),
      sub: "USDG paid out to sellers.",
    },
    {
      label: "Protocol fees",
      value: usd(state.protocolFees),
      sub: "USDG routed to the protocol treasury.",
    },
    {
      label: "Supply",
      value: `${compact(state.supply)} OMER`,
      sub: "Displayed supply after the live index.",
    },
    {
      label: "Shares",
      value: num(state.shares, 4),
      sub: "Underlying shares. Displayed OMER is shares times the index.",
    },
    {
      label: "Peak shares",
      value: num(state.peakShares, 0),
      sub: "High-water mark. Never resets.",
    },
    {
      label: "OMER per share",
      value: state.index.toFixed(6),
      sub: "The live index. Rises every epoch, all on its own.",
      tone: "accent",
    },
    {
      label: "Price / OMER",
      value: usdPrecise(state.pricePerOmer),
      sub: "Spot on the locked curve.",
    },
    {
      label: "Price / share",
      value: usdPrecise(state.pricePerShare),
      sub: "Spot OMER price times the live index.",
    },
    {
      label: "Reserve / share",
      value: usdPrecise(state.reservePerShare),
      sub: "Reserve USDG divided by total shares.",
    },
    {
      label: "Holders",
      value: num(state.holders, 0),
      live: true,
      sub: "Addresses carrying a non-zero share balance.",
    },
  ] satisfies Metric[]).filter((m) => IS_LIVE || !m.live);

  const pending: Metric[] = [
    { label: "Launch price", sub: "USDG per OMER at deployment.", value: TBA },
    { label: "Genesis supply", sub: "Shares minted when the contract goes live.", value: TBA },
    { label: "Reserve at launch", sub: "USDG standing behind that supply.", value: TBA },
    { label: "Curve slope", sub: "Price added per share minted.", value: TBA },
    { label: "Rebase per epoch", sub: "How far the index steps each period.", value: TBA },
    { label: "Epoch length", sub: "How often the index steps.", value: TBA },
    { label: "Trade fee", sub: "Taken both sides, split with the Reserve.", value: TBA },
    { label: "Vault target", sub: "Share of the Reserve allowed to earn yield.", value: TBA },
  ];

  const rows = IS_LIVE ? metrics : pending;

  return (
    <section>
      <div className="flex items-center gap-4 px-6 py-4 lg:px-10">
        <SystemLabel>{IS_LIVE ? "All metrics" : "Parameters"}</SystemLabel>
        <span className="h-px flex-1 bg-line" />
        <SystemLabel className="text-fg/25">
          {IS_LIVE
            ? `${metrics.length} readings`
            : "confirmed at deployment"}
        </SystemLabel>
      </div>

      <div className="grid border-l border-line sm:grid-cols-2 lg:grid-cols-4">
        {rows.map((m) => (
          <Stat
            key={m.label}
            label={m.label}
            value={m.value}
            sub={m.sub}
            tone={m.tone}
            className="border-r border-line"
          />
        ))}
      </div>
    </section>
  );
}
