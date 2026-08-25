import { Link } from "react-router-dom";
import { IS_LIVE } from "@/lib/protocol";
import { useProtocol } from "@/lib/protocol-context";
import { OmerMark } from "./OmerMark";
import { Panel, SystemLabel } from "./ui";

/**
 * Until `VITE_OMER_ADDRESS` points at a contract there is no market, so the
 * interface reports the state OMER launches in and nothing else. This says so.
 */
export function PreLaunchBar() {
  if (IS_LIVE) return null;

  return (
    <aside className="border-b border-line bg-accent/[0.07]">
      <div className="flex flex-col gap-2 px-6 py-3 sm:flex-row sm:items-center sm:gap-4 lg:px-10">
        <span className="system-label shrink-0 border border-accent/45 px-2 py-1 text-accent-soft">
          Before launch
        </span>
        <p className="text-[13px] leading-relaxed text-fg/60">
          OMER is not deployed. The mechanism below is settled, but the{" "}
          <span className="text-fg/85">figures are not</span>: price, supply,
          rate and fees are all confirmed at deployment, so nothing on this site
          quotes a number it cannot keep.
        </p>
        <Link
          to="/how-it-works"
          className="system-label shrink-0 text-fg/45 underline-offset-4 transition-colors hover:text-accent-soft hover:underline"
        >
          What is real →
        </Link>
      </div>
    </aside>
  );
}

/** What stands in for the order desk while there is nothing to quote. */
export function PreLaunchDesk() {
  const { identity, drawOmer } = useProtocol();

  return (
    <Panel scan className="flex flex-col">
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <SystemLabel>Order desk</SystemLabel>
        <SystemLabel className="text-accent-soft">Closed</SystemLabel>
      </div>

      <div className="space-y-6 p-5">
        <div>
          <SystemLabel className="mb-3">Opens at</SystemLabel>
          <div className="num text-[30px] leading-none text-fg/40">TBA</div>
          <p className="mt-4 text-[13px] leading-relaxed text-fg/50">
            A quote needs a price, and the price needs a deployed contract.
            Rather than show you a number that will not survive launch, the desk
            stays shut until there is one worth quoting.
          </p>
        </div>

        <div className="border-t border-line pt-5">
          {identity ? (
            <>
              <SystemLabel className="mb-4">Your omer</SystemLabel>
              <div className="flex items-center gap-3">
                <OmerMark size={34} />
                <div>
                  <div className="display text-[17px]">{identity.handle}</div>
                  <div className="system-label mt-1 text-fg/30">
                    held from before launch
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <SystemLabel className="mb-3">Before the desk opens</SystemLabel>
              <p className="text-[13px] leading-relaxed text-fg/50">
                Draw your omer. One per person, no wallet, no cost, and it is
                yours from the epoch you take it.
              </p>
              <button
                type="button"
                onClick={drawOmer}
                className="btn btn-accent mt-5 w-full"
              >
                Draw your omer
              </button>
            </>
          )}
        </div>
      </div>
    </Panel>
  );
}
