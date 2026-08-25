import { Link } from "react-router-dom";
import { useProtocol } from "@/lib/protocol-context";
import {
  APY_PERCENT,
  EPOCHS_PER_DAY,
  FEE_RATE,
  IS_LIVE,
  REBASE_RATE,
  quoteBuy,
} from "@/lib/protocol";
import { num, pct, usd, usdPrecise } from "@/lib/format";
import { TBA } from "@/lib/tba";
import { PageHead, Panel, Row, SectionMarker, SystemLabel } from "@/components/ui";

const EXAMPLE = 100;

export function HowItWorks() {
  const { state } = useProtocol();
  const q = quoteBuy(state.shares, state.index, EXAMPLE);
  const inADay = q.omer * Math.pow(1 + REBASE_RATE, EPOCHS_PER_DAY);

  const steps = [
    {
      n: "01",
      title: "Draw your omer",
      body: "One per person, and no wallet in sight. The handle and the sigil are your seat at the book, and drawing one is what opens the desk.",
      note: "Lives on this device. Costs nothing.",
    },
    {
      n: "02",
      title: "Buy shares, not OMER",
      body: "Most of every dollar mints shares along the curve. The rest is the fee, and the larger part of that stays in the Reserve standing behind you.",
      note: IS_LIVE
        ? `Price is ${usdPrecise(state.pricePerShare)} per share right now.`
        : "Fee split TBA.",
    },
    {
      n: "03",
      title: "Let the index run",
      body: "On a fixed clock the index steps up, and every balance moves by the same factor at the same instant. Nothing to stake, nothing to claim.",
      note: IS_LIVE
        ? `${num(EPOCHS_PER_DAY, 0)} steps a day, ${num(APY_PERCENT, 0)}% a year.`
        : "Step size and epoch length TBA.",
    },
    {
      n: "04",
      title: "Sell back to the Reserve",
      body: "Redemption prices shares on the inverse curve, never one dollar per displayed OMER. That is what keeps the pot larger than the claim against it.",
      note: "The Reserve pays every exit, not another buyer.",
    },
  ];

  return (
    <>
      <PageHead
        index="00"
        kicker="How it works"
        title={
          <>
            Four steps, and only one of them{" "}
            <span className="text-accent-soft">needs you awake</span>
          </>
        }
        lead="Two numbers describe every position. Shares move only when someone trades. The index moves only on the clock. Everything below follows from that split."
      />

      <section className="grid border-b border-line lg:grid-cols-4">
        {steps.map((step, i) => (
          <article
            key={step.n}
            className={
              "group relative px-6 py-9 lg:px-8 lg:py-10" +
              (i < 3 ? " border-b border-line lg:border-r lg:border-b-0" : "")
            }
          >
            <span
              aria-hidden
              className="absolute inset-x-0 top-0 h-px w-0 bg-accent transition-all duration-500 group-hover:w-full"
            />
            <SystemLabel className="mb-6 text-accent-soft">
              [ {step.n} ]
            </SystemLabel>
            <h2 className="display text-[21px]">{step.title}</h2>
            <p className="mt-4 text-[13px] leading-relaxed text-balance text-fg/50">
              {step.body}
            </p>
            <p className="system-label mt-6 text-fg/30">{step.note}</p>
          </article>
        ))}
      </section>

      <section className="grid border-b border-line lg:grid-cols-2">
        {IS_LIVE ? (
          <div className="border-line px-6 py-12 lg:border-r lg:px-10">
            <SectionMarker index="01" label="Worked example" className="mb-8" />
            <h2 className="display text-[26px] text-balance lg:text-[34px]">
              {usd(EXAMPLE)} in, at the price on the curve right now
            </h2>

            <div className="mt-8 divide-y divide-line border-y border-line">
              <Row label="You pay" value={`${usd(EXAMPLE)} USDG`} />
              <Row label="Fee taken" value={usd(q.fee, 2)} tone="muted" />
              <Row label="Shares minted" value={num(q.shares, 6)} tone="accent" />
              <Row label="OMER credited" value={num(q.omer, 4)} />
              <Row label="Curve move" value={pct(q.curveMove, 4)} tone="muted" />
              <Row
                label="All-in vs spot"
                value={pct(q.priceImpact, 2)}
                tone="muted"
              />
              <Row
                label="Displayed in 24h"
                value={num(inADay, 4)}
                tone="accent"
              />
              <Row
                label="Redeems for in 24h"
                value={usd(q.net * (1 - FEE_RATE), 2)}
                tone="muted"
              />
            </div>

            <p className="mt-6 text-[13px] leading-relaxed text-fg/40">
              The last two rows are the whole point. The displayed number climbs on
              its own overnight. The redemption line does not move unless somebody
              trades, because your share of the Reserve did not change.
            </p>
          </div>
        ) : (
          <div className="border-line px-6 py-12 lg:border-r lg:px-10">
            <SectionMarker index="01" label="Worked example" className="mb-8" />
            <h2 className="display text-[26px] text-balance lg:text-[34px]">
              The numbers land when the{" "}
              <span className="text-accent-soft">contract does</span>
            </h2>
            <p className="mt-6 max-w-md text-[14px] leading-relaxed text-fg/50">
              This is where a hundred dollars gets walked through the curve:
              the fee taken, the shares minted, how far the curve moves, and
              what the position redeems for a day later. Every one of those
              lines needs a deployed price, so the example waits with it.
            </p>
            <div className="mt-8 divide-y divide-line border-y border-line">
              {[
                "You pay",
                "Fee taken",
                "Shares minted",
                "OMER credited",
                "Curve move",
                "Displayed in 24h",
                "Redeems for in 24h",
              ].map((label) => (
                <Row key={label} label={label} value={TBA} tone="muted" />
              ))}
            </div>
          </div>
        )}

        <div className="px-6 py-12 lg:px-10">
          <SectionMarker index="02" label="What it does not do" className="mb-8" />
          <h2 className="display text-[26px] text-balance lg:text-[34px]">
            {IS_LIVE ? `${num(APY_PERCENT, 0)}%` : "The headline rate"} is an
            index, <span className="text-accent-soft">not income</span>
          </h2>

          <Panel className="mt-8 divide-y divide-line">
            {[
              {
                t: "It pays nobody",
                b: "The rebase multiplies every balance by the same factor at the same instant, so nobody gains ground on anybody and not one dollar enters the Reserve because of it.",
              },
              {
                t: "It is not yield",
                b: "Dollars only leave the Reserve when someone sells or the protocol takes its cut. Nothing is being harvested on your behalf.",
              },
              {
                t: "The curve can go down",
                b: "If buying stops, sellers walk the price back along the curve and the last one out gets the least. Solvency is a promise about redemption, not about profit.",
              },
            ].map((row) => (
              <div key={row.t} className="p-7">
                <h3 className="display text-[18px]">{row.t}</h3>
                <p className="mt-3 text-[13px] leading-relaxed text-fg/50">
                  {row.b}
                </p>
              </div>
            ))}
          </Panel>
        </div>
      </section>

      <section className="px-6 py-14 lg:px-10">
        <div className="flex flex-wrap items-center gap-3">
          <Link to="/" className="btn btn-accent">
            Open the order desk
          </Link>
          <Link to="/machine" className="btn btn-ghost">
            See the arithmetic
          </Link>
          <Link to="/docs" className="btn btn-accent">
            Read the docs
          </Link>
        </div>
      </section>
    </>
  );
}
