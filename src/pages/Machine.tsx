import { useProtocol } from "@/lib/protocol-context";
import { PageHead, Panel, SectionMarker, SystemLabel } from "@/components/ui";
import {
  APY_PERCENT,
  CURVE_A,
  EPOCHS_PER_DAY,
  EPOCHS_PER_YEAR,
  EPOCH_SECONDS,
  FEE_RATE,
  FEE_TO_PROTOCOL,
  FEE_TO_RESERVE,
  GENESIS_SHARES,
  IS_LIVE,
  LIQUID_FLOOR,
  REBASE_RATE,
  VAULT_APR,
  curveIntegral,
  pricePerShare,
} from "@/lib/protocol";
import { num, pctFine, usd, usdPrecise } from "@/lib/format";
import { TBA } from "@/lib/tba";

const INVARIANTS = [
  {
    id: "I1",
    claim: "Reserve >= curve integral",
    body: "Every buy adds more USDG than it adds claim. Every sell removes less than it removes claim. The gap can only widen.",
  },
  {
    id: "I2",
    claim: "Rebase mints no claim",
    body: "The index multiplies every wallet by the same factor, so no wallet's fraction of total shares changes. The Reserve is untouched.",
  },
  {
    id: "I3",
    claim: "Redemption prices shares",
    body: "Selling burns shares and pays the curve integral between the old and new share count. The displayed number is never the unit of account.",
  },
  {
    id: "I4",
    claim: "Liquid floor holds",
    body: "A fixed share of the Reserve stays in liquid USDG. The vault can never be filled past that line.",
  },
  {
    id: "I5",
    claim: "No keeper required",
    body: "The index is derived from elapsed epochs at read time. Nothing has to be poked, and a chain that goes quiet for a week catches up in one call.",
  },
  {
    id: "I6",
    claim: "Peak shares never resets",
    body: "The high-water mark on shares is monotonic, which makes historical dilution auditable from a single storage slot.",
  },
];

function CurvePlot() {
  const { state } = useProtocol();
  const W = 800;
  const H = 300;
  const maxShares = Math.max(state.shares * 1.6, GENESIS_SHARES * 2);
  const maxPrice = pricePerShare(maxShares);

  const x = (s: number) => (s / maxShares) * W;
  const y = (p: number) => H - (p / maxPrice) * (H - 20);

  const nowX = x(state.shares);
  const nowY = y(state.pricePerShare);

  return (
    <div>
      <div className="mb-4 flex items-baseline justify-between">
        <SystemLabel>
          Price curve · price(s) = {IS_LIVE ? CURVE_A : "A"} × s
        </SystemLabel>
        <span className="num text-[12px] text-fg/50">
          {IS_LIVE
            ? `${num(state.shares, 0)} shares @ ${usdPrecise(state.pricePerShare)}`
            : "slope TBA"}
        </span>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label="Bonding curve with the shaded reserve backing"
      >
        <defs>
          <linearGradient id="curve-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ff7a18" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#ff7a18" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {[0.25, 0.5, 0.75].map((t) => (
          <line
            key={t}
            x1="0"
            x2={W}
            y1={H * t}
            y2={H * t}
            stroke="rgba(255,255,255,0.05)"
          />
        ))}

        {/* Area under the curve up to the current supply: the reserve backing. */}
        <path
          d={`M0,${H} L${nowX},${nowY} L${nowX},${H} Z`}
          fill="url(#curve-fill)"
        />

        <line
          x1="0"
          y1={y(0)}
          x2={W}
          y2={y(maxPrice)}
          stroke="#ffb35c"
          strokeWidth="1.5"
        />

        <line
          x1={nowX}
          y1={0}
          x2={nowX}
          y2={H}
          stroke="rgba(255,255,255,0.18)"
          strokeDasharray="3 4"
        />
        <circle cx={nowX} cy={nowY} r="4" fill="#fafafa" />

        <text
          x={nowX + 10}
          y={nowY - 10}
          fill="rgba(250,250,250,0.55)"
          fontSize="11"
          fontFamily="Space Mono, monospace"
        >
          spot
        </text>
        <text
          x="12"
          y={H - 12}
          fill="rgba(250,250,250,0.3)"
          fontSize="11"
          fontFamily="Space Mono, monospace"
        >
          shaded area ={" "}
        {IS_LIVE ? usd(curveIntegral(state.shares)) : TBA} owed to shares
        </text>
      </svg>
    </div>
  );
}

function FlowDiagram() {
  const box = "border border-line px-4 py-3 text-center";

  // Worked against a hundred units. Derived from the constants rather than
  // typed in, so the diagram cannot drift from the fee the contract charges.
  const BASE = 100;
  const fee = BASE * FEE_RATE;
  const toCurve = BASE - fee;
  const kept = fee * FEE_TO_RESERVE;
  const toProtocol = fee * FEE_TO_PROTOCOL;
  const intoReserve = toCurve + kept;

  const v = (n: number, unit = " USDG") =>
    IS_LIVE ? `${num(n, n % 1 ? 1 : 0)}${unit}` : TBA;

  return (
    <div className="grid gap-px bg-line lg:grid-cols-[1fr_auto_1fr_auto_1fr]">
      <div className="bg-bg p-6">
        <SystemLabel className="mb-4 text-accent-soft">[ in ]</SystemLabel>
        <div className={box}>
          <div className="num text-[15px]">{v(BASE)}</div>
          <div className="system-label mt-2 text-fg/35">buyer pays</div>
        </div>
      </div>

      <div className="hidden items-center justify-center bg-bg px-4 lg:flex">
        <span className="system-label text-fg/25">&rarr;</span>
      </div>

      <div className="bg-bg p-6">
        <SystemLabel className="mb-4 text-accent-soft">[ split ]</SystemLabel>
        <div className="space-y-2">
          <div className={box}>
            <div className="num text-[15px]">{v(toCurve)}</div>
            <div className="system-label mt-2 text-fg/35">into the curve</div>
          </div>
          <div className={box}>
            <div className="num text-[15px] text-accent-soft">{v(kept)}</div>
            <div className="system-label mt-2 text-fg/35">fee, kept in Reserve</div>
          </div>
          <div className={box}>
            <div className="num text-[15px] text-fg/60">{v(toProtocol)}</div>
            <div className="system-label mt-2 text-fg/35">fee, protocol</div>
          </div>
        </div>
      </div>

      <div className="hidden items-center justify-center bg-bg px-4 lg:flex">
        <span className="system-label text-fg/25">&rarr;</span>
      </div>

      <div className="bg-bg p-6">
        <SystemLabel className="mb-4 text-accent-soft">[ out ]</SystemLabel>
        <div className={box}>
          <div className="num text-[15px]">shares minted</div>
          <div className="system-label mt-2 text-fg/35">
            sqrt(s&sup2; + 2&middot;net/A) &minus; s
          </div>
        </div>
        <div className={`${box} mt-2`}>
          <div className="num text-[15px] text-accent-soft">
            {IS_LIVE ? `${num(intoReserve, 1)} USDG in Reserve` : "Reserve grows"}
          </div>
          <div className="system-label mt-2 text-fg/35">
            {IS_LIVE ? `claim rose by ${num(toCurve, 0)}` : "claim grows by less"}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Machine() {
  const { state } = useProtocol();

  // Every one of these is a deployment choice, so before launch the table lists
  // what will be set rather than asserting a value for it.
  const params = IS_LIVE
    ? [
        { k: "Epoch length", v: `${EPOCH_SECONDS} s` },
        { k: "Epochs per day", v: num(EPOCHS_PER_DAY, 0) },
        { k: "Epochs per year", v: num(EPOCHS_PER_YEAR, 0) },
        { k: "Rebase per epoch", v: pctFine(REBASE_RATE) },
        { k: "Nominal per year", v: `${num(APY_PERCENT, 0)}%` },
        { k: "Curve slope A", v: String(CURVE_A) },
        { k: "Genesis shares", v: num(GENESIS_SHARES, 0) },
        { k: "Genesis reserve", v: usd(curveIntegral(GENESIS_SHARES)) },
        { k: "Fee", v: `${FEE_RATE * 100}% both sides` },
        { k: "Fee to Reserve", v: `${FEE_TO_RESERVE * 100}%` },
        { k: "Fee to protocol", v: `${FEE_TO_PROTOCOL * 100}%` },
        { k: "Liquid floor", v: `${LIQUID_FLOOR * 100}%` },
        { k: "Vault APR", v: `${VAULT_APR * 100}%` },
        { k: "Current epoch", v: num(state.epoch, 0) },
      ]
    : [
        "Epoch length",
        "Epochs per day",
        "Epochs per year",
        "Rebase per epoch",
        "Nominal per year",
        "Curve slope A",
        "Genesis shares",
        "Genesis reserve",
        "Fee",
        "Fee to Reserve",
        "Fee to protocol",
        "Liquid floor",
        "Vault APR",
      ].map((k) => ({ k, v: TBA }));

  return (
    <>
      <PageHead
        index="05"
        kicker="The machine"
        title={
          <>
            Two numbers, one curve,{" "}
            <span className="text-accent-soft">six invariants</span>
          </>
        }
        lead="Everything on this site is derived from the share count and the elapsed epoch count. There is no oracle, no keeper, no off-chain job, and nothing to trust beyond arithmetic."
      />

      <section className="border-b border-line px-6 py-12 lg:px-10">
        <SectionMarker index="A" label="Money in, shares out" className="mb-8" />
        <FlowDiagram />
        <p className="mt-8 max-w-2xl text-[14px] leading-relaxed text-fg/50">
          The buyer hands over one amount, the pot grows by slightly less, and
          the claim against the pot grows by less again. That gap is the entire
          reason the Reserve outruns its obligations, and it is the fee that was
          never allowed to leave. Selling runs the same arithmetic in reverse and
          leaves the same kind of gap behind.
        </p>
      </section>

      <section className="border-b border-line px-6 py-12 lg:px-10">
        <SectionMarker index="B" label="The curve" className="mb-8" />
        <CurvePlot />
      </section>

      <section className="border-b border-line px-6 py-12 lg:px-10">
        <SectionMarker index="C" label="Invariants" className="mb-10" />
        <div className="grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-3">
          {INVARIANTS.map((inv) => (
            <article key={inv.id} className="bg-bg p-7">
              <div className="mb-4 flex items-center gap-3">
                <span className="system-label text-accent-soft">{inv.id}</span>
                <span className="h-px flex-1 bg-line" />
              </div>
              <h3 className="display text-[19px]">{inv.claim}</h3>
              <p className="mt-3 text-[13px] leading-relaxed text-fg/45">
                {inv.body}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="px-6 py-12 lg:px-10">
        <SectionMarker index="D" label="Parameters" className="mb-8" />
        <Panel>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3">
            {params.map((p, i) => (
              <div
                key={p.k}
                className={
                  "flex items-baseline justify-between gap-4 border-line px-6 py-4" +
                  (i % 3 !== 2 ? " lg:border-r" : "") +
                  " border-b"
                }
              >
                <SystemLabel as="span">{p.k}</SystemLabel>
                <span className="num text-[13px] text-fg/75">{p.v}</span>
              </div>
            ))}
          </div>
        </Panel>
      </section>
    </>
  );
}
