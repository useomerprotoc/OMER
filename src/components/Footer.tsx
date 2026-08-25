import { Link } from "react-router-dom";
import { APY_PERCENT, IS_LIVE } from "@/lib/protocol";
import { num } from "@/lib/format";
import { EXPLORER_URL, GITHUB_URL, X_URL } from "@/lib/links";
import { Hairline, SystemLabel } from "./ui";
import { OmerMark } from "./OmerMark";


type FooterLink = { label: string; to?: string; href?: string };

/**
 * Names match the nav exactly. A footer that renames the same page invents a
 * second vocabulary for one site, and the reader has to work out that Guide and
 * Docs are the same place.
 *
 * Three columns rather than four: the old Reference column pointed at pages the
 * other two already listed, so it was padding with a heading on it.
 */
const COLUMNS: { title: string; blurb: string; links: FooterLink[] }[] = [
  {
    title: "Protocol",
    blurb: "What it is, and why the Reserve outruns the claim against it.",
    links: [
      { label: "How it works", to: "/how-it-works" },
      { label: "Machine", to: "/machine" },
      { label: "Docs", to: "/docs" },
    ],
  },
  {
    title: "Market",
    blurb: "Every surface that will carry a number once the contract is live.",
    links: [
      { label: "Trade", to: "/" },
      { label: "Market", to: "/market" },
      { label: "Reserve", to: "/reserve" },
      { label: "Holdings", to: "/holdings" },
    ],
  },
  {
    title: "Elsewhere",
    blurb: "Where the project talks, and where its source sits.",
    links: [
      { label: "X · @useomerprotoc", href: X_URL },
      ...(GITHUB_URL ? [{ label: "Source on GitHub", href: GITHUB_URL }] : []),
      { label: "Robinhood Chain", href: EXPLORER_URL },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-24 border-t border-line px-6 pt-16 pb-24 lg:px-10">
      <Hairline className="mb-16 opacity-40" />

      <div className="grid gap-12 lg:grid-cols-[1.3fr_repeat(3,1fr)]">
        <div>
          <div className="mb-4 flex items-center gap-3">
            <OmerMark size={32} className="opacity-80" />
            <span className="display text-[24px] tracking-[0.16em]">OMER</span>
          </div>
          <p className="max-w-sm text-[14px] leading-relaxed text-fg/45">
            An epoch-indexed reserve protocol. The index rises on a fixed clock.
            The Reserve, not another buyer, pays every exit.
          </p>
          <div className="system-label mt-6 text-fg/25">
            {IS_LIVE
              ? `${num(APY_PERCENT, 0)}% nominal · index only · not a yield`
              : "index only · not a yield · figures TBA"}
          </div>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.title}>
            <SystemLabel className="mb-3">{col.title}</SystemLabel>
            <p className="mb-6 max-w-[15rem] text-[13px] leading-relaxed text-fg/35">
              {col.blurb}
            </p>
            <ul className="space-y-3">
              {col.links.map((link) => (
                <li key={link.label}>
                  {link.href ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-center gap-1.5 text-[14px] text-fg/55 transition-colors hover:text-fg"
                    >
                      {link.label}
                      <span
                        aria-hidden
                        className="text-fg/25 transition-transform duration-300 group-hover:-translate-y-px group-hover:translate-x-px group-hover:text-accent-soft"
                      >
                        ↗
                      </span>
                    </a>
                  ) : (
                    <Link
                      to={link.to as string}
                      className="text-[14px] text-fg/55 transition-colors hover:text-fg"
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-16 flex flex-col gap-3 border-t border-line pt-8 sm:flex-row sm:items-center sm:justify-between">
        <SystemLabel className="text-fg/25">
          © 2026 OMER Protocol · before launch
        </SystemLabel>
        <SystemLabel className="text-fg/25">
          Displayed balance is an index, not a claim
        </SystemLabel>
      </div>
    </footer>
  );
}
