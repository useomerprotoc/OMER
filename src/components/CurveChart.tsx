import { useId, useMemo } from "react";
import {
  CURVE_A,
  GENESIS_SHARES,
  IS_LIVE,
  curveIntegral,
  pricePerShare,
} from "@/lib/protocol";
import { compact, usdPrecise } from "@/lib/format";
import { SystemLabel } from "./ui";

/**
 * The curve itself, not a price history.
 *
 * `price(s) = CURVE_A · s` is a fact about the contract, so this plot is true
 * before anyone has traded. It is the honest thing to show while OMER is not
 * deployed: not where the price has been, but where it goes as supply moves.
 */
export function CurveChart({
  shares,
  height = 260,
}: {
  shares: number;
  height?: number;
}) {
  const gradientId = useId();
  const W = 1000;
  const H = height;
  const PAD = 18;

  const maxShares = Math.max(GENESIS_SHARES * 4, shares * 1.6);
  const maxPrice = pricePerShare(maxShares);

  const { area, line, hereX, hereY } = useMemo(() => {
    const x = (s: number) => (s / maxShares) * W;
    const y = (p: number) => H - PAD - (p / maxPrice) * (H - PAD * 2);

    const pts = Array.from({ length: 61 }, (_, i) => {
      const s = (i / 60) * maxShares;
      return `${x(s).toFixed(1)},${y(pricePerShare(s)).toFixed(1)}`;
    });

    const d = `M${pts.join(" L")}`;
    return {
      line: d,
      area: `${d} L${W},${H} L0,${H} Z`,
      hereX: x(shares),
      hereY: y(pricePerShare(shares)),
    };
  }, [shares, maxShares, maxPrice, H]);

  return (
    <div className="relative">
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <SystemLabel>Price against supply · the curve</SystemLabel>
        <span className="num text-[13px] text-fg/60">
          {IS_LIVE
            ? `${usdPrecise(pricePerShare(shares))} at ${compact(shares)} shares`
            : "slope TBA"}
        </span>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="w-full"
        style={{ height }}
        role="img"
        aria-label={
          IS_LIVE
            ? `Price is ${CURVE_A} times the share count, currently ${usdPrecise(pricePerShare(shares))} at ${Math.round(shares)} shares`
            : "Price rises in a straight line with supply. The slope is set at deployment."
        }
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ff7a18" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#ff7a18" stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0.25, 0.5, 0.75].map((t) => (
          <line
            key={t}
            x1="0"
            x2={W}
            y1={H * t}
            y2={H * t}
            stroke="currentColor"
            strokeWidth="1"
            className="text-fg/8"
          />
        ))}

        <path d={area} fill={`url(#${gradientId})`} />
        <path
          d={line}
          fill="none"
          stroke="#ff7a18"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />

        {IS_LIVE ? (
          <>
            <line
              x1={hereX}
              x2={hereX}
              y1={hereY}
              y2={H}
              stroke="#ffb35c"
              strokeWidth="1"
              strokeDasharray="3 4"
              vectorEffect="non-scaling-stroke"
            />
            <circle cx={hereX} cy={hereY} r="4" fill="#ffb35c" />
          </>
        ) : null}
      </svg>

      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
        {IS_LIVE ? (
          <>
            <SystemLabel className="text-fg/35">
              slope {CURVE_A} USDG per share
            </SystemLabel>
            <SystemLabel className="text-fg/35">
              genesis {compact(GENESIS_SHARES)} shares at{" "}
              {usdPrecise(pricePerShare(GENESIS_SHARES))}
            </SystemLabel>
            <SystemLabel className="text-fg/35">
              reserve to back it {usdPrecise(curveIntegral(GENESIS_SHARES))}
            </SystemLabel>
          </>
        ) : (
          <>
            <SystemLabel className="text-fg/35">supply →</SystemLabel>
            <SystemLabel className="text-fg/35">↑ price</SystemLabel>
            <SystemLabel className="text-fg/35">
              slope, genesis and reserve all TBA
            </SystemLabel>
          </>
        )}
      </div>
    </div>
  );
}
