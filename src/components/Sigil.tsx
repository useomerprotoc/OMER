import { useId } from "react";
import { sigilTraits } from "@/lib/identity";

/**
 * A one-per-browser face, drawn as a sibling of the OMER mark: same heavy ring,
 * same diagonal slice, but the angle, the orbit ticks and the core all fall out
 * of the identity id. Nothing random at render time.
 */
export function Sigil({
  id,
  size = 28,
  className,
}: {
  id: string;
  size?: number;
  className?: string;
}) {
  const maskId = useId();
  const t = sigilTraits(id);

  const ticks = Array.from({ length: t.tickCount }, (_, i) => {
    const deg = t.tickPhase + (360 / t.tickCount) * i;
    const rad = (deg * Math.PI) / 180;
    return {
      x1: 24 + Math.cos(rad) * 20,
      y1: 24 + Math.sin(rad) * 20,
      x2: 24 + Math.cos(rad) * 22.5,
      y2: 24 + Math.sin(rad) * 22.5,
    };
  });

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      role="img"
      aria-label="Identity sigil"
    >
      <defs>
        <mask id={maskId}>
          <rect x="0" y="0" width="48" height="48" fill="#fff" />
          <rect
            x="-18"
            y="21"
            width="84"
            height="6"
            fill="#000"
            transform={`rotate(${t.sliceAngle} 24 24)`}
          />
        </mask>
      </defs>

      <circle
        cx="24"
        cy="24"
        r="14"
        stroke="currentColor"
        strokeWidth="5.5"
        mask={`url(#${maskId})`}
      />

      {t.hasInnerRing ? (
        <circle
          cx="24"
          cy="24"
          r="8"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.45"
        />
      ) : null}

      <circle cx="24" cy="24" r={t.coreRadius} fill="currentColor" />

      {ticks.map((tick) => (
        <line
          key={`${tick.x1}-${tick.y1}`}
          x1={tick.x1}
          y1={tick.y1}
          x2={tick.x2}
          y2={tick.y2}
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          opacity="0.6"
        />
      ))}
    </svg>
  );
}
