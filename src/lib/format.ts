const usdFmt = (min: number, max: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: min,
    maximumFractionDigits: max,
  });

export function usd(v: number, decimals = 0): string {
  if (!Number.isFinite(v)) return "—";
  return usdFmt(decimals, decimals).format(v);
}

export function usdPrecise(v: number): string {
  if (!Number.isFinite(v)) return "—";
  if (Math.abs(v) >= 1000) return usd(v, 0);
  if (Math.abs(v) >= 1) return usd(v, 2);
  return usdFmt(4, 6).format(v);
}

export function num(v: number, decimals = 2): string {
  if (!Number.isFinite(v)) return "—";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(v);
}

export function compact(v: number): string {
  if (!Number.isFinite(v)) return "—";
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(v);
}

export function pct(v: number, decimals = 2): string {
  if (!Number.isFinite(v)) return "—";
  const sign = v > 0 ? "+" : "";
  return `${sign}${num(v * 100, decimals)}%`;
}

/** Long-tail percentages such as the per-epoch rate need seven places, not two. */
export function pctFine(v: number): string {
  if (!Number.isFinite(v)) return "—";
  return `+${(v * 100).toFixed(7).replace(/0+$/, "").replace(/\.$/, "")}%`;
}

export function clock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const rest = s % 60;
  return `${String(m).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

export function utcClock(ms: number): string {
  const d = new Date(ms);
  return [d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds()]
    .map((v) => String(v).padStart(2, "0"))
    .join(":");
}

export function ago(ms: number, now: number): string {
  const s = Math.max(0, Math.floor((now - ms) / 1000));
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

export function shortAddress(a: string): string {
  if (!a || a.length < 10) return a;
  return `${a.slice(0, 6)}...${a.slice(-4)}`;
}

export function padIndex(n: number, width = 2): string {
  return String(n).padStart(width, "0");
}
