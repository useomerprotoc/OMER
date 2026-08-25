import { useProtocol } from "@/lib/protocol-context";
import { EPOCH_SECONDS } from "@/lib/protocol";
import { clock } from "@/lib/format";

/**
 * The clock, drawn as one hairline. It fills left to right across the epoch and
 * snaps back the instant the index steps, which is the only moving part on the
 * page that is not a number.
 */
export function EpochBar() {
  const { state } = useProtocol();
  const progress = 1 - state.secondsToNext / EPOCH_SECONDS;
  const pct = Math.min(100, Math.max(0, progress * 100));

  return (
    <div
      role="progressbar"
      aria-label="Progress through the current epoch"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      aria-valuetext={`${clock(state.secondsToNext)} until epoch ${state.epoch + 1}`}
      className="relative h-px w-full bg-line"
    >
      <span
        className="absolute inset-y-0 left-0 bg-accent transition-[width] duration-1000 ease-linear"
        style={{ width: `${pct}%` }}
      />
      <span
        aria-hidden
        className="absolute top-0 h-px w-16 -translate-x-full transition-[left] duration-1000 ease-linear"
        style={{
          left: `${pct}%`,
          background:
            "linear-gradient(90deg, transparent, var(--color-accent-soft))",
        }}
      />
    </div>
  );
}
