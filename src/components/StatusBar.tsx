import { useProtocol } from "@/lib/protocol-context";
import { clock, num, utcClock } from "@/lib/format";
import { CHAIN_ID } from "@/lib/protocol";
import { Dot } from "./ui";

/** Fixed instrument strip along the bottom. Everything here updates each second. */
export function StatusBar() {
  const { state, live, address, chainOk, identity } = useProtocol();

  const cells = [
    {
      key: "mode",
      node: (
        <span className="flex items-center gap-2">
          <Dot tone={live ? "up" : "warn"} />
          {live ? "Live" : "Not deployed"}
        </span>
      ),
    },
    ...(live
      ? [
          { key: "epoch", node: `Epoch ${num(state.epoch, 0)}` },
          { key: "next", node: `Next ${clock(state.secondsToNext)}` },
        ]
      : [{ key: "epoch", node: "Epoch TBA" }]),
    {
      key: "index",
      node: live ? `Index ${state.index.toFixed(6)}` : "Index TBA",
    },
    {
      key: "holder",
      node: identity ? identity.handle : "Unclaimed",
    },
    {
      key: "chain",
      node: address && !chainOk ? "Wrong network" : `Chain ${CHAIN_ID}`,
    },
    { key: "utc", node: utcClock(state.now) },
  ];

  return (
    <div
      role="status"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/90 backdrop-blur-md"
    >
      <div className="flex items-center gap-0 overflow-x-auto">
        {cells.map((cell, i) => (
          <span
            key={cell.key}
            className={
              "system-label whitespace-nowrap px-4 py-2.5 text-fg/45" +
              (i === 0 ? "" : " border-l border-line")
            }
          >
            {cell.node}
          </span>
        ))}
        <span className="hidden flex-1 sm:block" />
        <span className="system-label hidden whitespace-nowrap border-l border-line px-4 py-2.5 text-fg/25 lg:block">
          OMER Protocol · v0.1.0
        </span>
      </div>
    </div>
  );
}
