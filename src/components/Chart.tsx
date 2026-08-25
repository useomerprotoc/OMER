import { useId, useMemo } from "react";
import type { EpochPoint } from "@/lib/engine";
import { usdPrecise } from "@/lib/format";
import { SystemLabel } from "./ui";

type Series = "pricePerOmer" | "pricePerShare" | "reserve" | "shares";

/**
 * Hand-rolled area chart. No chart library, no runtime animation, so it renders
 * identically on first paint.
 */
export function Chart({
  points,
  series,
  label,
  height = 220,
  format = usdPrecise,
}: {
  points: EpochPoint[];
  series: Series;
  label: string;
  height?: number;
  format?: (v: number) => string;
}) {
  const gradientId = useId();
  const W = 1000;
  const H = height;
  const PAD_Y = 16;

  const { path, area, min, max, last, first } = useMemo(() => {
    const values = points.map((p) => p[series]);
    const lo = Math.min(...values);
    const hi = Math.max(...values);
    const span = hi - lo || 1;

    const coords = values.map((v, i) => {
      const x = points.length > 1 ? (i / (points.length - 1)) * W : 0;
      const y = H - PAD_Y - ((v - lo) / span) * (H - PAD_Y * 2);
      return [x, y] as const;
    });

    const d = coords
      .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`)
      .join(" ");

    return {
      path: d,
      area: `${d} L${W},${H} L0,${H} Z`,
      min: lo,
      max: hi,
      last: values[values.length - 1] ?? 0,
      first: values[0] ?? 0,
    };
  }, [points, series, H]);

  const up = last >= first;

  return (
    <div className="relative">
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <SystemLabel>{label}</SystemLabel>
        <span className="num text-[13px] text-fg/60">{format(last)}</span>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="w-full"
        style={{ height }}
        role="img"
        aria-label={`${label}, ${format(first)} to ${format(last)}`}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ff7a18" stopOpacity="0.34" />
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
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        ))}

        <path d={area} fill={`url(#${gradientId})`} />
        <path
          d={path}
          fill="none"
          stroke={up ? "#ffb35c" : "#e5484d"}
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
          strokeLinejoin="round"
        />
      </svg>

      <div className="mt-3 flex items-center justify-between">
        <SystemLabel className="text-fg/25">low {format(min)}</SystemLabel>
        <SystemLabel className="text-fg/25">high {format(max)}</SystemLabel>
      </div>
    </div>
  );
}
