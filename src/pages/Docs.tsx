import { useProtocol } from "@/lib/protocol-context";
import { PageHead, Panel, SectionMarker, SystemLabel } from "@/components/ui";
import {
  APY_PERCENT,
  EPOCHS_PER_DAY,
  EPOCH_SECONDS,
  FEE_RATE,
  IS_LIVE,
  OMER_ADDRESS,
  REBASE_RATE,
  YEARLY_MULTIPLE,
} from "@/lib/protocol";
import { NETWORK, explorerToken } from "@/lib/network";
import { num, pctFine } from "@/lib/format";
import { TBA, numT, usdPreciseT, usdT } from "@/lib/tba";

const SECTIONS = [
  { id: "hold", label: "Hold" },
  { id: "trade", label: "Trade" },
  { id: "reserve", label: "Reserve" },
  { id: "fees", label: "Fees" },
  { id: "risk", label: "Risk" },
  { id: "contracts", label: "Contracts" },
];

export function Docs() {
  const { state } = useProtocol();

  return (
    <>
      <PageHead
        index="06"
        kicker="Guide"
        title={
          <>
            How OMER works,{" "}
            <span className="text-accent-soft">including the parts that hurt</span>
          </>
        }
        lead="Short version: the display compounds, the claim does not. Everything below is an expansion of that sentence."
      />

      <div className="grid lg:grid-cols-[200px_minmax(0,1fr)]">
        <nav
          aria-label="Guide sections"
          className="hidden border-r border-line p-8 lg:block"
        >
          <div className="sticky top-40 space-y-3">
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="system-label block text-fg/35 transition-colors hover:text-accent-soft"
              >
                {s.label}
              </a>
            ))}
          </div>
        </nav>

        <div className="divide-y divide-line">
          <section id="hold" className="px-6 py-14 lg:px-12">
            <SectionMarker index="01" label="Hold" className="mb-8" />
            <h2 className="display max-w-2xl text-[32px] lg:text-[40px]">
              Hold OMER.{" "}
              {IS_LIVE
                ? `The number rises every ${EPOCH_SECONDS / 60} minutes.`
                : "The number rises on a fixed clock."}
            </h2>
            <p className="mt-6 max-w-2xl text-[15px] leading-relaxed text-fg/55">
              You do not stake, claim, or compound. There is nothing to click and
              no keeper has to poke the contract, because the next read already
              includes every epoch that has passed since the last one.
            </p>

            <div className="mt-10 grid max-w-2xl gap-px border border-line bg-line sm:grid-cols-3">
              {[
                {
                  k: "Per epoch",
                  v: IS_LIVE ? pctFine(REBASE_RATE) : TBA,
                },
                {
                  k: "Per day",
                  v: IS_LIVE ? `${EPOCHS_PER_DAY} epochs` : TBA,
                },
                {
                  k: "Per year",
                  v: IS_LIVE ? `${num(YEARLY_MULTIPLE, 0)}x` : TBA,
                },
              ].map((c) => (
                <div key={c.k} className="bg-bg px-5 py-6">
                  <SystemLabel className="mb-3">{c.k}</SystemLabel>
                  <div className="num text-[17px] text-accent-soft">{c.v}</div>
                </div>
              ))}
            </div>

            <p className="mt-8 max-w-2xl text-[15px] leading-relaxed text-fg/55">
              Under the number you see, you own shares. The rebase raises OMER per
              share. Shares themselves do not move when the clock ticks. Sending
              OMER to another wallet moves shares, and both wallets keep indexing
              afterwards.
            </p>
          </section>

          <section id="trade" className="px-6 py-14 lg:px-12">
            <SectionMarker index="02" label="Trade" className="mb-8" />
            <h2 className="display max-w-2xl text-[32px] lg:text-[40px]">
              The price is a function, not a quote.
            </h2>
            <p className="mt-6 max-w-2xl text-[15px] leading-relaxed text-fg/55">
              There is no order book and no counterparty. Buying mints shares
              along a linear curve and pays the Reserve. Selling burns shares and
              is paid by the Reserve at exactly the integral between the old and
              new share count.
            </p>

            <Panel className="mt-10 max-w-2xl divide-y divide-line">
              {[
                ["Spot per OMER", usdPreciseT(state.pricePerOmer)],
                ["Spot per share", usdPreciseT(state.pricePerShare)],
                ["Reserve per share", usdPreciseT(state.reservePerShare)],
                ["Shares outstanding", numT(state.shares, 4)],
              ].map(([k, v]) => (
                <div
                  key={k}
                  className="flex items-baseline justify-between gap-4 px-5 py-3.5"
                >
                  <SystemLabel as="span">{k}</SystemLabel>
                  <span className="num text-[13px]">{v}</span>
                </div>
              ))}
            </Panel>
          </section>

          <section id="reserve" className="px-6 py-14 lg:px-12">
            <SectionMarker index="03" label="Reserve" className="mb-8" />
            <h2 className="display max-w-2xl text-[32px] lg:text-[40px]">
              Every sell is paid by the Reserve, not by the next buyer.
            </h2>
            <p className="mt-6 max-w-2xl text-[15px] leading-relaxed text-fg/55">
              The pot holds {usdT(state.reserve)} against a curve claim of{" "}
              {usdT(state.backing)}, a surplus of {usdT(state.surplus)}. That
              surplus is fee income that has never left, and it can only grow with
              volume. A fixed floor of the pot stays in liquid USDG so exits do
              not wait on a vault.
            </p>
          </section>

          <section id="fees" className="px-6 py-14 lg:px-12">
            <SectionMarker index="04" label="Fees" className="mb-8" />
            <h2 className="display max-w-2xl text-[32px] lg:text-[40px]">
              {IS_LIVE
                ? `${FEE_RATE * 100}% on the way in. ${FEE_RATE * 100}% on the way out.`
                : "A fee on the way in. The same fee on the way out."}
            </h2>
            <p className="mt-6 max-w-2xl text-[15px] leading-relaxed text-fg/55">
              The larger part of every fee stays in the Reserve and lifts the
              backing behind every share. The rest is protocol revenue. What a
              round trip costs you before any curve movement is both fees
              compounded, and that figure{" "}
              {IS_LIVE
                ? `is about ${num((1 - Math.pow(1 - FEE_RATE, 2)) * 100, 0)}%`
                : "is set at deployment"}
              . It is the number that actually decides whether a trade was worth
              making.
            </p>
          </section>

          <section id="risk" className="px-6 py-14 lg:px-12">
            <SectionMarker index="05" label="Risk" className="mb-8" />
            <h2 className="display max-w-2xl text-[32px] lg:text-[40px]">
              The APY cannot manufacture USDG.
            </h2>
            <div className="mt-6 max-w-2xl space-y-5 text-[15px] leading-relaxed text-fg/55">
              <p>
                {IS_LIVE ? `${num(APY_PERCENT, 0)}%` : "The headline rate"} is
                an index, not income. It multiplies
                every wallet by the same factor at the same instant, so nobody
                gains ground on anybody, and not one dollar enters the Reserve
                because of it. Anyone reading the displayed balance as earnings
                has misread it.
              </p>
              <p>
                Dollars leave the Reserve for exactly two reasons: someone sells,
                or the protocol takes its cut. Dollars enter for exactly two
                reasons: someone buys, or the vault earns. If buying stops, the
                price still falls back down the curve as sellers walk it
                backwards, and the last seller gets the least.
              </p>
              <p>
                The curve is solvent by construction, which is a narrow promise. It
                guarantees that redemptions can always be paid at the curve price.
                It guarantees nothing about that price being higher than what you
                paid.
              </p>
            </div>
          </section>

          <section id="contracts" className="px-6 py-14 lg:px-12">
            <SectionMarker index="06" label="Contracts" className="mb-8" />
            <h2 className="display max-w-2xl text-[32px] lg:text-[40px]">
              One contract, no admin key over the Reserve.
            </h2>

            <Panel className="mt-10 max-w-2xl divide-y divide-line">
              <div className="flex items-baseline justify-between gap-4 px-5 py-3.5">
                <SystemLabel as="span">Network</SystemLabel>
                <span className="num text-[13px]">
                  {NETWORK.name} · {NETWORK.id}
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-4 px-5 py-3.5">
                <SystemLabel as="span">RPC</SystemLabel>
                <span className="num text-[12px] text-fg/60">
                  rpc.mainnet.chain.robinhood.com
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-4 px-5 py-3.5">
                <SystemLabel as="span">OMER</SystemLabel>
                {OMER_ADDRESS ? (
                  <a
                    href={explorerToken(OMER_ADDRESS)}
                    target="_blank"
                    rel="noreferrer"
                    className="num text-[12px] text-accent-soft hover:underline"
                  >
                    {OMER_ADDRESS}
                  </a>
                ) : (
                  <span className="num text-[12px] text-fg/40">
                    not deployed
                  </span>
                )}
              </div>
              <div className="flex items-baseline justify-between gap-4 px-5 py-3.5">
                <SystemLabel as="span">Quote asset</SystemLabel>
                <span className="num text-[12px] text-fg/60">USDG · 6dp</span>
              </div>
            </Panel>

            <p className="mt-8 max-w-2xl text-[14px] leading-relaxed text-fg/40">
              Source for the token and the Reserve lives in{" "}
              <span className="num text-fg/60">contracts/Omer.sol</span>. Until an
              address is wired into{" "}
              <span className="num text-fg/60">VITE_OMER_ADDRESS</span>, this
              interface reports the state OMER launches in and lets you move the
              curve against your own book, which lives in this browser: no chain
              writes, no wallet risk.
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
