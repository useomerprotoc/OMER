import { NavLink, Link } from "react-router-dom";
import { clsx } from "clsx";
import { useProtocol } from "@/lib/protocol-context";
import { clock, shortAddress } from "@/lib/format";
import { Dot } from "./ui";
import { OmerMark } from "./OmerMark";
import { IdentityChip } from "./Identity";
import { Social } from "./Social";
import { EpochBar } from "./EpochBar";

const LINKS = [
  { to: "/how-it-works", label: "How it works" },
  { to: "/", label: "Trade", end: true },
  { to: "/holdings", label: "Holdings" },
  { to: "/reserve", label: "Reserve" },
  { to: "/market", label: "Market" },
  { to: "/machine", label: "Machine" },
  { to: "/docs", label: "Docs" },
];

export function Nav() {
  const { address, connect, disconnect, connecting, live, state } =
    useProtocol();

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-bg/85 backdrop-blur-md">
      <div className="flex items-center gap-3 border-b border-line px-6 py-2 lg:px-10">
        <Dot tone={live ? "up" : "accent"} />
        <span className="system-label text-fg/40">
          {live ? "Live" : "Before launch"}
        </span>
        <span className="system-label text-fg/25">
          {live ? `next epoch ${clock(state.secondsToNext)}` : "Parameters TBA"}
        </span>
        <span className="hidden h-px flex-1 bg-line sm:block" />
        <span className="system-label hidden text-fg/25 sm:block">
          Reserve-backed · epoch-indexed · redemption prices shares, not display
        </span>
      </div>

      <div className="flex items-center justify-between gap-6 px-6 py-4 lg:px-10">
        <Link to="/" className="group flex items-center gap-3">
          <OmerMark
            size={28}
            className="transition-transform duration-500 group-hover:scale-110"
          />
          <span className="display text-[19px] tracking-[0.16em]">OMER</span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-7 lg:flex">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                clsx(
                  "system-label relative whitespace-nowrap transition-colors duration-300",
                  "after:absolute after:-bottom-1 after:left-0 after:h-px after:bg-accent-soft after:transition-all after:duration-300",
                  isActive
                    ? "text-fg after:w-full"
                    : "text-fg/40 after:w-0 hover:text-fg hover:after:w-full",
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-5">
          <Social />
          <IdentityChip />
          {live ? (
            <button
              type="button"
              onClick={address ? disconnect : connect}
              disabled={connecting}
              className="btn px-4 py-2 text-[11px]"
            >
              {connecting
                ? "Connecting"
                : address
                  ? shortAddress(address)
                  : "Connect"}
            </button>
          ) : null}
        </div>
      </div>

      <nav
        aria-label="Primary mobile"
        className="flex gap-5 overflow-x-auto border-t border-line px-6 py-2.5 lg:hidden"
      >
        {LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              clsx(
                "system-label whitespace-nowrap",
                isActive ? "text-accent-soft" : "text-fg/40",
              )
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      {live ? <EpochBar /> : null}
    </header>
  );
}
