import { useProtocol } from "@/lib/protocol-context";
import { Chart } from "@/components/Chart";
import { CurveChart } from "@/components/CurveChart";
import { PageHead, Panel, Row, SystemLabel } from "@/components/ui";
import { IS_LIVE, LIQUID_FLOOR, VAULT_APR } from "@/lib/protocol";
import { num, pct, usd } from "@/lib/format";
import { TBA, usdT } from "@/lib/tba";

export function Reserve() {
  const { state } = useProtocol();

  const vaultShare = state.reserve > 0 ? state.vault / state.reserve : 0;
  const liquidShare = 1 - vaultShare;
  const coverage = state.backing > 0 ? state.reserve / state.backing : 1;
  const solvent = state.reserve >= state.backing;
  const floorOk = state.liquid >= state.requiredLiquid;

  return (
    <>
      <PageHead
        index="03"
        kicker="The Reserve"
        title={
          <>
            One pot. It funds every exit,{" "}
            <span className="text-accent-soft">and it never runs dry</span>
          </>
        }
        lead="Buyers pay into it, sellers are paid out of it, and the fee keeps a slice on the way through in both directions. Because redemption follows the same curve backwards, the pot is always at least as large as the claim against it."
      />

      <section className="grid border-b border-line lg:grid-cols-4">
        {[
          { label: "Reserve", value: usdT(state.reserve), sub: "total USDG" },
          {
            label: "Liquid",
            value: usdT(state.liquid),
            sub: IS_LIVE ? pct(liquidShare, 1) : "share of the Reserve",
          },
          {
            label: "In vault",
            value: usdT(state.vault),
            sub: IS_LIVE
              ? `${pct(vaultShare, 1)} at ${pct(VAULT_APR, 1)} APR`
              : "target weight and APR TBA",
          },
          {
            label: "Coverage",
            value: IS_LIVE ? `${num(coverage, 4)}x` : TBA,
            sub: solvent ? "fully backed" : "under-backed",
          },
        ].map((cell, i) => (
          <div
            key={cell.label}
            className={
              "px-6 py-8 lg:px-8" +
              (i < 3 ? " border-b border-line lg:border-r lg:border-b-0" : "")
            }
          >
            <SystemLabel className="mb-4">{cell.label}</SystemLabel>
            <div className="num text-[26px] leading-none">{cell.value}</div>
            <div className="system-label mt-3 text-fg/30">{cell.sub}</div>
          </div>
        ))}
      </section>

      <section className="grid border-b border-line lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="border-line px-6 py-10 lg:border-r lg:px-10">
          {IS_LIVE ? (
            <Chart
              points={state.history.slice(-336)}
              series="reserve"
              label="Reserve · last 7 days"
              height={260}
              format={(v) => usd(v)}
            />
          ) : (
            <CurveChart shares={state.shares} height={260} />
          )}
        </div>

        <div className="border-t border-line px-6 py-10 lg:border-t-0 lg:px-10">
          <SystemLabel className="mb-6">Composition</SystemLabel>

          <div
            className="mb-6 flex h-3 w-full overflow-hidden border border-line"
            role="img"
            aria-label={`Liquid ${pct(liquidShare, 1)}, vault ${pct(vaultShare, 1)}`}
          >
            <span
              className="block bg-accent-soft"
              style={{ width: `${liquidShare * 100}%` }}
            />
            <span
              className="block bg-accent-deep"
              style={{ width: `${vaultShare * 100}%` }}
            />
          </div>

          <div className="divide-y divide-line border-y border-line">
            <Row label="Liquid USDG" value={usdT(state.liquid)} tone="accent" />
            <Row label="Vault NAV" value={usdT(state.vault)} />
            <Row
              label="Required liquid"
              value={usdT(state.requiredLiquid)}
              tone="muted"
            />
            <Row
              label="Liquid floor"
              value={IS_LIVE ? `${LIQUID_FLOOR * 100}%` : TBA}
              tone="muted"
            />
            <Row
              label="Floor status"
              value={IS_LIVE ? (floorOk ? "Satisfied" : "Breached") : TBA}
              tone={IS_LIVE ? (floorOk ? "up" : "down") : "muted"}
            />
          </div>

          <SystemLabel className="mt-10 mb-6">Solvency</SystemLabel>
          <div className="divide-y divide-line border-y border-line">
            <Row label="Curve backing" value={usdT(state.backing)} />
            <Row
              label="Surplus"
              value={usdT(state.surplus)}
              tone={IS_LIVE ? (state.surplus >= 0 ? "up" : "down") : "muted"}
            />
            <Row
              label="Coverage"
              value={IS_LIVE ? `${num(coverage, 4)}x` : TBA}
              tone="accent"
            />
            <Row
              label="Reserve / share"
              value={usdT(state.reservePerShare, 2)}
              tone="muted"
            />
          </div>
        </div>
      </section>

      <section className="px-6 py-12 lg:px-10">
        <Panel className="grid lg:grid-cols-3">
          {[
            {
              n: "A",
              title: "Buy",
              body: "Most of every dollar mints shares along the curve. The rest is the fee, and the larger part of that stays in the Reserve rather than leaving with the protocol. The exact split is set at deployment.",
            },
            {
              n: "B",
              title: "Sell",
              body: "The same curve, walked backwards. The Reserve releases exactly the integral between the old and new share count, the fee is taken off the top, and the rest is wired out.",
            },
            {
              n: "C",
              title: "Why it holds",
              body: "The curve integral is the only claim on the pot, and every trade adds to the pot without adding to the claim. Surplus can only grow. Rebasing never touches either side.",
            },
          ].map((card, i) => (
            <article
              key={card.n}
              className={
                "p-8" + (i < 2 ? " border-b border-line lg:border-r lg:border-b-0" : "")
              }
            >
              <SystemLabel className="mb-5 text-accent-soft">
                [ {card.n} ]
              </SystemLabel>
              <h3 className="display text-[22px]">{card.title}</h3>
              <p className="mt-4 text-[14px] leading-relaxed text-fg/50">
                {card.body}
              </p>
            </article>
          ))}
        </Panel>
      </section>
    </>
  );
}
