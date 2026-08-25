import { useState } from "react";
import { clsx } from "clsx";
import { useProtocol } from "@/lib/protocol-context";
import { Chart } from "@/components/Chart";
import { PageHead, SystemLabel } from "@/components/ui";
import { CurveChart } from "@/components/CurveChart";
import { IS_LIVE } from "@/lib/protocol";
import { ago, compact, num, pct, usd, usdPrecise } from "@/lib/format";
import { TBA } from "@/lib/tba";

const RANGES = [
  { key: "24h", epochs: 48 },
  { key: "7d", epochs: 336 },
  { key: "30d", epochs: 1440 },
  { key: "all", epochs: Number.MAX_SAFE_INTEGER },
] as const;

const SERIES = [
  { key: "pricePerOmer", label: "Price / OMER" },
  { key: "pricePerShare", label: "Price / share" },
  { key: "shares", label: "Shares outstanding" },
] as const;

export function Market() {
  const { state } = useProtocol();
  const [range, setRange] = useState<(typeof RANGES)[number]["key"]>("7d");
  const [series, setSeries] = useState<(typeof SERIES)[number]["key"]>(
    "pricePerOmer",
  );

  const epochs = RANGES.find((r) => r.key === range)!.epochs;
  const points = state.history.slice(-Math.min(epochs, state.history.length));
  const activeSeries = SERIES.find((s) => s.key === series)!;

  const cells: { label: string; value: string; sub: string; tone?: boolean }[] =
    IS_LIVE
      ? [
          {
            label: "Price / OMER",
            value: usdPrecise(state.pricePerOmer),
            sub: `${pct(state.change24h, 2)} / 24h`,
            tone: state.change24h >= 0,
          },
          {
            label: "Volume 24h",
            value: usd(state.volume24h),
            sub: "buys and sells, gross",
          },
          {
            label: "Supply",
            value: compact(state.supply),
            sub: `${num(state.shares, 0)} shares`,
          },
          {
            label: "Holders",
            value: num(state.holders, 0),
            sub: "non-zero share balances",
          },
        ]
      : [
          {
            label: "Launch price",
            value: TBA,
            sub: "USDG per OMER at deployment",
          },
          {
            label: "Genesis supply",
            value: TBA,
            sub: "shares minted at deployment",
          },
          {
            label: "Reserve at launch",
            value: TBA,
            sub: "USDG standing behind that supply",
          },
          {
            label: "Traded so far",
            value: "None",
            sub: "no fills until deployment",
          },
        ];

  return (
    <>
      <PageHead
        index="04"
        kicker="Market"
        title={
          <>
            The tape, the curve, and{" "}
            <span className="text-accent-soft">every fill on the book</span>
          </>
        }
        lead="Price is not quoted by a market maker. It is the curve evaluated at the current share count, so the whole tape is a function of one number. Until OMER is deployed, that share count comes from a replayed book rather than a chain."
      />

      <section className="grid border-b border-line sm:grid-cols-2 lg:grid-cols-4">
        {cells.map((cell, i) => (
          <div
            key={cell.label}
            className={clsx(
              "px-6 py-7",
              i < 3 && "border-b border-line sm:border-r lg:border-b-0",
            )}
          >
            <SystemLabel className="mb-3">{cell.label}</SystemLabel>
            <div className="num text-[24px] leading-none">{cell.value}</div>
            <div
              className={clsx(
                "system-label mt-3",
                cell.tone === undefined
                  ? "text-fg/30"
                  : cell.tone
                    ? "text-success"
                    : "text-danger",
              )}
            >
              {cell.sub}
            </div>
          </div>
        ))}
      </section>

      {IS_LIVE ? (
        <section className="border-b border-line px-6 py-10 lg:px-10">
          <div className="mb-8 flex flex-wrap items-center gap-3">
            <div className="flex">
              {SERIES.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setSeries(s.key)}
                  className={clsx(
                    "system-label border px-3 py-2 transition-colors",
                    series === s.key
                      ? "border-accent bg-accent/10 text-accent-soft"
                      : "border-line text-fg/35 hover:text-fg/70",
                    "-ml-px first:ml-0",
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <span className="hidden h-px flex-1 bg-line sm:block" />

            <div className="flex">
              {RANGES.map((r) => (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => setRange(r.key)}
                  className={clsx(
                    "system-label border px-3 py-2 transition-colors",
                    range === r.key
                      ? "border-fg/30 text-fg"
                      : "border-line text-fg/35 hover:text-fg/70",
                    "-ml-px first:ml-0",
                  )}
                >
                  {r.key}
                </button>
              ))}
            </div>
          </div>

          <Chart
            points={points}
            series={activeSeries.key}
            label={`${activeSeries.label} · ${range}`}
            height={320}
            format={
              series === "shares"
                ? (v) => num(v, 0)
                : (v) => usdPrecise(v)
            }
          />
        </section>
      ) : (
        <section className="border-b border-line px-6 py-10 lg:px-10">
          <CurveChart shares={state.shares} height={320} />
          <p className="mt-8 max-w-2xl text-[14px] leading-relaxed text-fg/45">
            There is no price history to plot, because nothing has traded, and
            no axis values either, because the slope is set at deployment. What
            is settled is the shape: price rises in a straight line with supply,
            so every share costs a little more than the one before it. That is
            the whole pricing model.
          </p>
        </section>
      )}

      {IS_LIVE ? (
        <section className="px-6 py-10 lg:px-10">
          <div className="mb-6 flex items-center gap-4">
            <SystemLabel>Tape</SystemLabel>
            <span className="h-px flex-1 bg-line" />
            <SystemLabel className="text-fg/25">
              last {state.fills.length} fills
            </SystemLabel>
          </div>

          <div className="overflow-x-auto border border-line">
            <table className="w-full min-w-[680px] border-collapse">
              <thead>
                <tr className="border-b border-line bg-white/[0.02]">
                  {["Side", "Account", "Epoch", "USDG", "OMER", "Price", "Age"].map(
                    (h) => (
                      <th
                        key={h}
                        className="system-label px-4 py-3 text-left text-fg/35"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {state.fills.slice(0, 40).map((fill, i) => (
                  <tr
                    key={`${fill.ts}-${i}`}
                    className="border-b border-line last:border-b-0 hover:bg-white/[0.015]"
                  >
                    <td className="px-4 py-3">
                      <span
                        className={clsx(
                          "system-label",
                          fill.side === "buy" ? "text-success" : "text-danger",
                        )}
                      >
                        {fill.side}
                      </span>
                    </td>
                    <td className="num px-4 py-3 text-[12px] text-fg/40">
                      {fill.actor}
                    </td>
                    <td className="num px-4 py-3 text-[12px] text-fg/40">
                      {num(fill.epoch, 0)}
                    </td>
                    <td className="num px-4 py-3 text-[12px]">
                      {usd(fill.usdg, 2)}
                    </td>
                    <td className="num px-4 py-3 text-[12px] text-fg/70">
                      {num(fill.omer, 4)}
                    </td>
                    <td className="num px-4 py-3 text-[12px] text-fg/70">
                      {usdPrecise(fill.pricePerOmer)}
                    </td>
                    <td className="num px-4 py-3 text-[12px] text-fg/35">
                      {ago(fill.ts, state.now)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </>
  );
}
