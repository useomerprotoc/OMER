import type { ReactNode } from "react";

/**
 * The backdrop: a warm black field with an ember bloom rising from the lower
 * right and a diagonal terminator cutting the two apart.
 *
 * Every layer is a gradient or vector, nothing raster, so it stays sharp at any
 * pixel density, and the page-wide grain over it dithers these gradients so
 * they do not band on a large display.
 */
export function Atmosphere() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Base field. Warm black, never neutral grey. */}
      <div className="absolute inset-0 bg-[#0a0806]" />

      {/* The ember. Anchored past the bottom-right corner so only the shoulder
          of the bloom is on screen, which is what makes it read as distance. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(115% 85% at 76% 112%, #ffb35c 0%, #ff7a18 22%, #d2601a 38%, #7a3208 58%, rgba(10,8,6,0) 76%)",
        }}
      />

      {/* A second, tighter core so the hottest part does not wash out flat. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(48% 34% at 82% 108%, #ffd9a3 0%, rgba(255,170,80,0.45) 40%, rgba(10,8,6,0) 72%)",
          mixBlendMode: "screen",
        }}
      />

      {/* The terminator: a black wedge driven in from the left, splitting the
          frame diagonally the way a shadow crosses a planet. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(107deg, #060403 0%, #060403 34%, rgba(6,4,3,0.86) 46%, rgba(6,4,3,0) 63%)",
        }}
      />

      {/* The lit rim riding along that same edge. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(107deg, transparent 44%, rgba(255,196,130,0.16) 49.5%, rgba(255,150,60,0.05) 52%, transparent 58%)",
        }}
      />

      {/* Top-down scrim so headlines always land on near-black. */}
      <div
        className="absolute inset-x-0 top-0 h-[45vh]"
        style={{
          background:
            "linear-gradient(180deg, #0a0806 0%, rgba(10,8,6,0.7) 45%, rgba(10,8,6,0) 100%)",
        }}
      />

      <Orbits />
      <Stars />

      {/* Settle back into the page colour at the bottom edge, no hard seam. */}
      <div
        className="absolute inset-x-0 bottom-0 h-32"
        style={{
          background:
            "linear-gradient(180deg, rgba(10,8,6,0) 0%, var(--color-bg) 100%)",
        }}
      />
    </div>
  );
}

/** Concentric orbit rings, barely there, centred on the bloom. */
function Orbits() {
  return (
    <svg
      className="absolute inset-0 h-full w-full"
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <radialGradient id="orbit-fade" cx="76%" cy="112%" r="70%">
          <stop offset="0%" stopColor="#ffd9a3" stopOpacity="0.5" />
          <stop offset="60%" stopColor="#ffb35c" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#ffb35c" stopOpacity="0" />
        </radialGradient>
      </defs>
      {[210, 330, 470, 620, 790].map((r) => (
        <circle
          key={r}
          cx="1094"
          cy="1008"
          r={r}
          fill="none"
          stroke="url(#orbit-fade)"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
}

/** A handful of dust motes. Fixed positions, no randomness at runtime. */
const MOTES = [
  { x: "18%", y: "22%", s: 1.5, o: 0.5 },
  { x: "63%", y: "13%", s: 1, o: 0.35 },
  { x: "86%", y: "31%", s: 2, o: 0.55 },
  { x: "41%", y: "44%", s: 1, o: 0.28 },
  { x: "72%", y: "58%", s: 1.5, o: 0.4 },
  { x: "28%", y: "71%", s: 1, o: 0.3 },
  { x: "92%", y: "66%", s: 1, o: 0.45 },
  { x: "9%", y: "52%", s: 1, o: 0.22 },
];

function Stars() {
  return (
    <div className="absolute inset-0">
      {MOTES.map((m) => (
        <span
          key={`${m.x}-${m.y}`}
          className="absolute rounded-full bg-white"
          style={{
            left: m.x,
            top: m.y,
            width: m.s,
            height: m.s,
            opacity: m.o,
          }}
        />
      ))}
    </div>
  );
}

/**
 * A hero band that carries the atmosphere. Everything below the fold sits on
 * flat black, which is what keeps the data legible.
 */
export function Fold({
  children,
  className,
  tall = false,
}: {
  children: ReactNode;
  className?: string;
  tall?: boolean;
}) {
  return (
    <section
      className={[
        "relative isolate flex flex-col justify-end overflow-hidden border-b border-line",
        tall ? "min-h-[86vh]" : "min-h-[46vh]",
        className ?? "",
      ].join(" ")}
    >
      <Atmosphere />
      <div className="relative z-10 w-full">{children}</div>
    </section>
  );
}
