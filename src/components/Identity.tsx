import { Link } from "react-router-dom";
import { useProtocol } from "@/lib/protocol-context";
import { EPOCHS_PER_DAY, IS_LIVE } from "@/lib/protocol";
import { num } from "@/lib/format";
import { Sigil } from "./Sigil";
import { Panel, Row, SystemLabel } from "./ui";

/** Nav-height identity: draw once, then it is a link into your own position. */
export function IdentityChip() {
  const { identity, drawOmer } = useProtocol();

  if (!identity) {
    return (
      <button
        type="button"
        onClick={drawOmer}
        className="btn btn-accent px-4 py-2 text-[11px]"
      >
        Draw your omer
      </button>
    );
  }

  return (
    <Link
      to="/holdings"
      className="group flex items-center gap-2.5 border border-line px-3 py-1.5 transition-colors duration-300 hover:border-accent/40"
    >
      <Sigil
        id={identity.id}
        size={18}
        className="text-accent-soft transition-transform duration-500 group-hover:rotate-45"
      />
      <span className="system-label text-fg/60 transition-colors group-hover:text-fg">
        {identity.handle}
      </span>
    </Link>
  );
}

/** The full card, shown at the top of Holdings and to first-time visitors. */
export function IdentityPanel({ className }: { className?: string }) {
  const { identity, drawOmer, releaseOmer, state } = useProtocol();

  if (!identity) {
    return (
      <Panel className={className} scan>
        <div className="p-8">
          <SystemLabel className="mb-4">Unclaimed</SystemLabel>
          <h2 className="display text-[26px]">One omer per person.</h2>
          <p className="mt-4 max-w-md text-[14px] leading-relaxed text-fg/50">
            Draw once and the handle is yours from that epoch onward, along with
            a sigil no one else gets. It lives on this device, costs nothing, and
            needs no wallet.
          </p>
          <button
            type="button"
            onClick={drawOmer}
            className="btn btn-accent mt-8"
          >
            Draw your omer
          </button>
        </div>
      </Panel>
    );
  }

  const epochsHeld = Math.max(0, state.epoch - identity.genesisEpoch);
  const daysHeld = epochsHeld / EPOCHS_PER_DAY;

  return (
    <Panel className={className}>
      <div className="flex flex-col gap-8 p-8 sm:flex-row sm:items-start">
        <Sigil id={identity.id} size={88} className="shrink-0 text-accent" />

        <div className="min-w-0 flex-1">
          <SystemLabel className="mb-3">Your omer</SystemLabel>
          <div className="display text-[30px] break-all">{identity.handle}</div>

          <div className="mt-6 divide-y divide-line border-y border-line">
            {IS_LIVE ? (
              <>
                <Row
                  label="Drawn at epoch"
                  value={num(identity.genesisEpoch, 0)}
                  tone="accent"
                />
                <Row label="Epochs since" value={num(epochsHeld, 0)} />
                <Row label="Days held" value={num(daysHeld, 2)} tone="muted" />
              </>
            ) : (
              <>
                <Row label="Drawn" value="Before launch" tone="accent" />
                <Row
                  label="Held since"
                  value={new Date(identity.createdAt).toISOString().slice(0, 10)}
                  tone="muted"
                />
              </>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={releaseOmer}
              className="btn btn-ghost px-4 py-2 text-[11px]"
            >
              Release and redraw
            </button>
            <span className="system-label text-fg/25">
              clears your book too
            </span>
          </div>
        </div>
      </div>
    </Panel>
  );
}
