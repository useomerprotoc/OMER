import { Link } from "react-router-dom";
import { useProtocol } from "@/lib/protocol-context";
import { positionValue } from "@/lib/engine";
import {
  EPOCHS_PER_DAY,
  EPOCHS_PER_YEAR,
  IS_LIVE,
  REBASE_RATE,
} from "@/lib/protocol";
import { ago, num, pct, usd, usdPrecise } from "@/lib/format";
import { PageHead, Panel, Row, SystemLabel } from "@/components/ui";
import { IdentityPanel } from "@/components/Identity";

const HORIZONS = [
  { label: "Next epoch", epochs: 1 },
  { label: "24 hours", epochs: EPOCHS_PER_DAY },
  { label: "7 days", epochs: EPOCHS_PER_DAY * 7 },
  { label: "30 days", epochs: EPOCHS_PER_DAY * 30 },
  { label: "1 year", epochs: EPOCHS_PER_YEAR },
];

export function Holdings() {
  const { state, book, resetBook } = useProtocol();
  const pos = positionValue(book.shares, state);
  const pnl = pos.redeemValue - book.costBasis;
  const pnlPct = book.costBasis > 0 ? pnl / book.costBasis : 0;

  return (
    <>
      <PageHead
        index="02"
        kicker="Position"
        title={
          <>
            What you hold, and what it is{" "}
            <span className="text-accent-soft">actually worth</span>
          </>
        }
        lead="Two columns, always. The display is what the index shows you. The redemption is what the Reserve would hand back if you sold the whole position right now."
      />

      <section className="border-b border-line px-6 py-10 lg:px-10">
        <IdentityPanel className="max-w-3xl" />
      </section>

      {book.shares <= 0 ? (
        <section className="px-6 py-20 lg:px-10">
          <Panel className="max-w-xl p-8">
            <SystemLabel className="mb-4">No position</SystemLabel>
            <h2 className="display text-[26px]">Nothing to index yet.</h2>
            <p className="mt-4 text-[14px] leading-relaxed text-fg/50">
              {IS_LIVE
                ? `Open the order desk and take a position. Your book starts you with ${usd(book.cash)} of test USDG.`
                : "The desk opens when OMER is deployed. Until then there is nothing to hold, but the omer you draw now is yours from the epoch you take it."}
            </p>
            <Link to={IS_LIVE ? "/" : "/how-it-works"} className="btn mt-8">
              {IS_LIVE ? "Open the order desk" : "How it works"}
            </Link>
          </Panel>
        </section>
      ) : (
        <>
          <section className="grid border-b border-line lg:grid-cols-3">
            <div className="border-line px-6 py-8 lg:border-r lg:px-10">
              <SystemLabel className="mb-4">Displayed OMER</SystemLabel>
              <div className="num text-[34px] leading-none text-accent-soft">
                {num(pos.omer, 6)}
              </div>
              <div className="system-label mt-3 text-fg/30">
                grows every 30 minutes, on its own
              </div>
            </div>

            <div className="border-t border-line px-6 py-8 lg:border-t-0 lg:border-r lg:px-10">
              <SystemLabel className="mb-4">Redemption value</SystemLabel>
              <div className="num text-[34px] leading-none">
                {usd(pos.redeemValue, 2)}
              </div>
              <div className="system-label mt-3 text-fg/30">
                net of fee, on the inverse curve
              </div>
            </div>

            <div className="border-t border-line px-6 py-8 lg:border-t-0 lg:px-10">
              <SystemLabel className="mb-4">Unrealised</SystemLabel>
              <div
                className={
                  "num text-[34px] leading-none " +
                  (pnl >= 0 ? "text-success" : "text-danger")
                }
              >
                {pnl >= 0 ? "+" : ""}
                {usd(pnl, 2)}
              </div>
              <div className="system-label mt-3 text-fg/30">
                {pct(pnlPct, 2)} on {usd(book.costBasis, 2)} in
              </div>
            </div>
          </section>

          <section className="grid gap-0 border-b border-line lg:grid-cols-2">
            <div className="border-line px-6 py-10 lg:border-r lg:px-10">
              <SystemLabel className="mb-6">Position detail</SystemLabel>
              <div className="divide-y divide-line border-y border-line">
                <Row label="Shares held" value={num(book.shares, 6)} />
                <Row
                  label="Share of supply"
                  value={pct(book.shares / state.shares, 4)}
                />
                <Row label="Index" value={state.index.toFixed(6)} tone="accent" />
                <Row
                  label="Spot value"
                  value={usd(pos.spotValue, 2)}
                  tone="muted"
                />
                <Row
                  label="Reserve claim"
                  value={usd(book.shares * state.reservePerShare, 2)}
                  tone="muted"
                />
                <Row label="Cost basis" value={usd(book.costBasis, 2)} />
                <Row
                  label="Test cash"
                  value={`${num(book.cash, 2)} USDG`}
                  tone="muted"
                />
              </div>

              <button
                type="button"
                onClick={resetBook}
                className="btn btn-ghost mt-8"
              >
                Reset your book
              </button>
            </div>

            <div className="border-t border-line px-6 py-10 lg:border-t-0 lg:px-10">
              <SystemLabel className="mb-6">
                What the index adds, and what it does not
              </SystemLabel>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[380px] border-collapse">
                  <thead>
                    <tr className="border-b border-line">
                      <th className="system-label py-3 text-left text-fg/35">
                        Horizon
                      </th>
                      <th className="system-label py-3 text-right text-fg/35">
                        Displayed
                      </th>
                      <th className="system-label py-3 text-right text-fg/35">
                        Redeems for
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {HORIZONS.map((h) => {
                      const grown =
                        pos.omer * Math.pow(1 + REBASE_RATE, h.epochs);
                      return (
                        <tr key={h.label} className="border-b border-line">
                          <td className="system-label py-3.5 text-fg/60">
                            {h.label}
                          </td>
                          <td className="num py-3.5 text-right text-[13px] text-accent-soft">
                            {grown >= 1e6
                              ? grown.toExponential(3)
                              : num(grown, 3)}
                          </td>
                          <td className="num py-3.5 text-right text-[13px] text-fg/70">
                            {usd(pos.redeemValue, 2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <p className="mt-6 text-[13px] leading-relaxed text-fg/40">
                The right column never moves on its own. Rebasing multiplies every
                wallet by the same factor, so it changes no one&rsquo;s share of
                the Reserve. Only trades, fees and vault yield move that column.
              </p>
            </div>
          </section>
        </>
      )}

      {book.trades.length > 0 ? (
        <section className="px-6 py-10 lg:px-10">
          <div className="mb-6 flex items-center gap-4">
            <SystemLabel>Your fills</SystemLabel>
            <span className="h-px flex-1 bg-line" />
            <SystemLabel className="text-fg/25">
              {book.trades.length} records
            </SystemLabel>
          </div>

          <div className="overflow-x-auto border border-line">
            <table className="w-full min-w-[620px] border-collapse">
              <thead>
                <tr className="border-b border-line bg-white/[0.02]">
                  {["Side", "Epoch", "USDG", "OMER", "Price", "Age"].map((h) => (
                    <th
                      key={h}
                      className="system-label px-4 py-3 text-left text-fg/35"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {book.trades.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b border-line last:border-b-0"
                  >
                    <td className="px-4 py-3">
                      <span
                        className={
                          "system-label " +
                          (t.side === "buy" ? "text-success" : "text-danger")
                        }
                      >
                        {t.side}
                      </span>
                    </td>
                    <td className="num px-4 py-3 text-[12px] text-fg/45">
                      {num(t.epoch, 0)}
                    </td>
                    <td className="num px-4 py-3 text-[12px]">
                      {usd(t.usdg, 2)}
                    </td>
                    <td className="num px-4 py-3 text-[12px] text-fg/70">
                      {num(t.omer, 4)}
                    </td>
                    <td className="num px-4 py-3 text-[12px] text-fg/70">
                      {usdPrecise(t.price)}
                    </td>
                    <td className="num px-4 py-3 text-[12px] text-fg/35">
                      {ago(t.ts, state.now)}
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
