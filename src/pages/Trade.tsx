import { Link } from "react-router-dom";
import { OrderDesk } from "@/components/OrderDesk";
import { PreLaunchDesk } from "@/components/PreLaunch";
import { KeyFigures, MetricGrid, ReserveBanner } from "@/components/Metrics";
import { Hairline, SectionMarker, SystemLabel } from "@/components/ui";
import { Fold } from "@/components/Atmosphere";
import { useProtocol } from "@/lib/protocol-context";
import {
  APY_PERCENT,
  EPOCHS_PER_DAY,
  EPOCH_SECONDS,
  IS_LIVE,
  REBASE_RATE,
} from "@/lib/protocol";
import { clock, num, pctFine } from "@/lib/format";
import { TBA } from "@/lib/tba";

export function Trade() {
  const { state } = useProtocol();

  return (
    <>
      <Fold tall>
        <div className="px-6 pt-16 pb-14 lg:px-10 lg:pt-24">
        <SectionMarker
          index="01"
          label="Epoch-indexed reserve protocol · est. 2026"
          className="mb-10 max-w-4xl"
        />

        <h1 className="display max-w-5xl text-[44px] text-balance sm:text-[60px] lg:text-[76px]">
          The number in your wallet{" "}
          <span className="text-accent-soft">rises on the clock</span>, not on a
          promise
        </h1>

        <p className="mt-8 max-w-3xl text-[16px] leading-relaxed text-balance text-fg/70">
          {IS_LIVE ? (
            <>
              Every {EPOCH_SECONDS / 60} minutes the index steps up by{" "}
              {pctFine(REBASE_RATE)} and every balance grows with it. No staking,
              no claiming, no keeper to poke. Every buy funds the Reserve. Every
              sell is paid by it.
            </>
          ) : (
            <>
              On a fixed clock the index steps up and every balance grows with
              it. No staking, no claiming, no keeper to poke. Every buy funds the
              Reserve. Every sell is paid by it. The figures behind that sentence
              are set when the contract goes live, not before.
            </>
          )}
        </p>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link to="/how-it-works" className="btn btn-accent">
            How it works
          </Link>
          <Link to="/docs" className="btn btn-accent">
            Read the docs
          </Link>
        </div>

        <Hairline className="mt-14 max-w-4xl opacity-50" />

        <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-3">
          <SystemLabel className="text-fg/45">
            {IS_LIVE ? `${num(APY_PERCENT, 0)}% nominal per year` : "Rate TBA"}
          </SystemLabel>
          <SystemLabel className="text-fg/45">
            {IS_LIVE ? `${pctFine(REBASE_RATE)} per epoch` : "Epoch length TBA"}
          </SystemLabel>
          <SystemLabel className="text-fg/45">
            {IS_LIVE
              ? `next step in ${clock(state.secondsToNext)}`
              : "Launch price TBA"}
          </SystemLabel>
        </div>
        </div>
      </Fold>

      <KeyFigures />
      <ReserveBanner />

      <section className="grid gap-0 border-b border-line lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="order-2 px-6 py-10 lg:order-1 lg:px-10">
          <SectionMarker index="01" label="What the clock does" className="mb-8" />
          <h2 className="display max-w-xl text-[28px] lg:text-[36px]">
            Shares are yours. The index is the market&rsquo;s.
          </h2>
          <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-fg/50">
            Under the number you see, you own shares. Trading is the only thing
            that moves them. The rebase raises OMER per share, so the display
            climbs while your slice of the Reserve stays exactly where you left
            it.
          </p>

          <div className="mt-10 grid gap-px border border-line bg-line sm:grid-cols-3">
            {[
              { k: "Clock", v: IS_LIVE ? `${EPOCH_SECONDS / 60} minutes` : TBA },
              { k: "Per day", v: IS_LIVE ? `${EPOCHS_PER_DAY} epochs` : TBA },
              { k: "Staking", v: "None" },
            ].map((cell) => (
              <div key={cell.k} className="bg-bg px-5 py-6">
                <SystemLabel className="mb-3">{cell.k}</SystemLabel>
                <div className="num text-[18px]">{cell.v}</div>
              </div>
            ))}
          </div>

          {IS_LIVE ? (
            <div className="mt-8 border border-line">
              <div className="border-b border-line px-5 py-3">
                <SystemLabel>Ledger preview · one share</SystemLabel>
              </div>
              <div className="divide-y divide-line">
                {[0, 1, 2, 3].map((step) => {
                  const idx = state.index * Math.pow(1 + REBASE_RATE, step);
                  const t = new Date(state.epochStart + step * EPOCH_SECONDS * 1000);
                  return (
                    <div
                      key={step}
                      className="flex items-center justify-between px-5 py-3"
                    >
                      <span className="system-label text-fg/40">
                        {String(t.getUTCHours()).padStart(2, "0")}:
                        {String(t.getUTCMinutes()).padStart(2, "0")} UTC
                      </span>
                      <span className="num text-[13px] text-fg/80">
                        {idx.toFixed(6)} OMER
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="mt-8 border border-line">
              <div className="border-b border-line px-5 py-3">
                <SystemLabel>Ledger preview · one share</SystemLabel>
              </div>
              <div className="px-5 py-8">
                <div className="num text-[18px] text-fg/40">TBA</div>
                <p className="mt-3 max-w-md text-[13px] leading-relaxed text-fg/40">
                  This table walks one share forward epoch by epoch. It needs the
                  step size and the epoch length, and both are set when the
                  contract is deployed.
                </p>
              </div>
            </div>
          )}
        </div>

        <aside className="order-1 border-line p-6 lg:order-2 lg:border-l">
          {IS_LIVE ? <OrderDesk /> : <PreLaunchDesk />}
        </aside>
      </section>

      <MetricGrid />
    </>
  );
}
