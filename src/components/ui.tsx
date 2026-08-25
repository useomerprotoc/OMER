import type { CSSProperties, ReactNode } from "react";
import { clsx } from "clsx";
import { Fold } from "./Atmosphere";

/** Fixed film grain at 3%, which is what stops the wide gradients banding. */
export function NoiseOverlay() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[100] opacity-[0.03]"
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
      }}
    />
  );
}

export function Scanline({ height = "100%" }: { height?: string }) {
  return (
    <div
      aria-hidden
      className="animate-scan pointer-events-none absolute top-0 left-0 h-px w-full"
      style={
        {
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)",
          "--scan-distance": height,
        } as CSSProperties
      }
    />
  );
}

export function Hairline({ className }: { className?: string }) {
  return <div aria-hidden className={clsx("hairline", className)} />;
}

export function SystemLabel({
  children,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "span" | "p";
}) {
  return (
    <Tag className={clsx("system-label text-fg/40", className)}>{children}</Tag>
  );
}

/** The bracketed counter that heads every block: [ 00 ], [ A ], §01. */
export function SectionMarker({
  index,
  label,
  className,
}: {
  index: string;
  label?: string;
  className?: string;
}) {
  return (
    <div className={clsx("flex items-center gap-4", className)}>
      <span className="system-label text-accent-soft">[ {index} ]</span>
      {label ? (
        <>
          <span className="h-px flex-1 bg-line" />
          <span className="system-label text-fg/40">{label}</span>
        </>
      ) : null}
    </div>
  );
}

export function Panel({
  children,
  className,
  scan = false,
}: {
  children: ReactNode;
  className?: string;
  scan?: boolean;
}) {
  return (
    <div className={clsx("panel relative overflow-hidden", className)}>
      {scan ? <Scanline height="100%" /> : null}
      {children}
    </div>
  );
}

export function Stat({
  label,
  value,
  sub,
  hint,
  tone = "default",
  className,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  hint?: string;
  tone?: "default" | "accent" | "up" | "down";
  className?: string;
}) {
  const toneClass =
    tone === "accent"
      ? "text-accent-soft"
      : tone === "up"
        ? "text-success"
        : tone === "down"
          ? "text-danger"
          : "text-fg";

  return (
    <div
      className={clsx(
        "group relative border-t border-line px-5 py-6 transition-colors hover:bg-white/[0.015]",
        className,
      )}
      title={hint}
    >
      <SystemLabel className="mb-3">{label}</SystemLabel>
      <div className={clsx("num text-[22px] leading-none", toneClass)}>
        {value}
      </div>
      {sub ? (
        <div className="mt-2.5 text-[12px] leading-snug text-fg/35">{sub}</div>
      ) : null}
    </div>
  );
}

export function Row({
  label,
  value,
  tone,
}: {
  label: string;
  value: ReactNode;
  tone?: "muted" | "accent" | "up" | "down";
}) {
  const toneClass =
    tone === "muted"
      ? "text-fg/45"
      : tone === "accent"
        ? "text-accent-soft"
        : tone === "up"
          ? "text-success"
          : tone === "down"
            ? "text-danger"
            : "text-fg";

  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <SystemLabel as="span">{label}</SystemLabel>
      <span className={clsx("num text-[13px]", toneClass)}>{value}</span>
    </div>
  );
}

export function Tabs<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  ariaLabel: string;
}) {
  return (
    <div role="tablist" aria-label={ariaLabel} className="grid grid-cols-2">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={clsx(
              "system-label border py-3 transition-all duration-300",
              active
                ? "border-accent bg-accent/10 text-accent-soft"
                : "border-line text-fg/40 hover:border-fg/25 hover:text-fg/70",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function Pill({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: "default" | "accent" | "up" | "down" | "warn";
}) {
  const map = {
    default: "border-line text-fg/50",
    accent: "border-accent/40 text-accent-soft",
    up: "border-success/40 text-success",
    down: "border-danger/40 text-danger",
    warn: "border-warning/40 text-warning",
  } as const;

  return (
    <span
      className={clsx(
        "system-label inline-flex items-center gap-1.5 border px-2 py-1",
        map[tone],
      )}
    >
      {children}
    </span>
  );
}

export function Dot({ tone = "accent" }: { tone?: "accent" | "up" | "warn" }) {
  const map = {
    accent: "bg-accent-soft",
    up: "bg-success",
    warn: "bg-warning",
  } as const;
  return (
    <span
      aria-hidden
      className={clsx("animate-pulse-dot inline-block size-1.5", map[tone])}
    />
  );
}

/** Big page heading, always paired with a marker and a kicker line. */
export function PageHead({
  index,
  kicker,
  title,
  lead,
}: {
  index: string;
  kicker: string;
  title: ReactNode;
  lead?: ReactNode;
}) {
  return (
    <Fold>
      <header className="px-6 py-14 lg:px-10 lg:py-20">
        <SectionMarker index={index} label={kicker} className="mb-8 max-w-3xl" />
        <h1 className="display max-w-3xl text-[40px] text-balance lg:text-[56px]">
          {title}
        </h1>
        {lead ? (
          <p className="mt-6 max-w-2xl text-[15px] leading-relaxed text-balance text-fg/60">
            {lead}
          </p>
        ) : null}
      </header>
    </Fold>
  );
}
