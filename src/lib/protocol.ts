/**
 * OMER protocol constants and curve math.
 *
 * Two numbers live in every wallet:
 *   shares   - what you actually own. Only trading changes it.
 *   index    - OMER displayed per share. Only the clock changes it.
 * Displayed OMER = shares x index. Redemption prices shares, never the display.
 */

export const EPOCH_SECONDS = 1800;
export const EPOCHS_PER_DAY = 48;
export const EPOCHS_PER_YEAR = EPOCHS_PER_DAY * 365;

/** Tuned so one year of compounding lands on exactly x1,001 (100,000% APY). */
export const REBASE_RATE = 0.0003944131;

/** Linear price curve on shares: price(s) = CURVE_A * s. */
export const CURVE_A = 5e-5;

/** 10% on both sides. Three quarters stays in the Reserve, one quarter is protocol revenue. */
export const FEE_RATE = 0.1;
export const FEE_TO_RESERVE = 0.75;
export const FEE_TO_PROTOCOL = 0.25;

/** At least half the Reserve must sit in liquid USDG, never in the vault. */
export const LIQUID_FLOOR = 0.5;
export const VAULT_TARGET = 0.4;
export const VAULT_APR = 0.042;

export const GENESIS_MS = Date.UTC(2026, 7, 3, 0, 0, 0);
export const GENESIS_SHARES = 20_000;

export const CHAIN_ID = 4663;
export const OMER_ADDRESS =
  (import.meta.env.VITE_OMER_ADDRESS as string | undefined) ?? "";
export const IS_LIVE = OMER_ADDRESS.length === 42;

/** Reserve required to back `s` shares along the curve: the integral of price. */
export function curveIntegral(s: number): number {
  return (CURVE_A / 2) * s * s;
}

export function pricePerShare(s: number): number {
  return CURVE_A * s;
}

/** Shares minted when `net` USDG (post-fee) enters the curve at supply `s`. */
export function sharesForDeposit(s: number, net: number): number {
  return Math.sqrt(s * s + (2 * net) / CURVE_A) - s;
}

/** USDG released from the curve when `ds` shares are burned at supply `s`. */
export function proceedsForShares(s: number, ds: number): number {
  const s2 = Math.max(0, s - ds);
  return curveIntegral(s) - curveIntegral(s2);
}

export function indexAtEpoch(epoch: number): number {
  return Math.pow(1 + REBASE_RATE, epoch);
}

export function epochAt(ms: number): number {
  return Math.max(0, Math.floor((ms - GENESIS_MS) / 1000 / EPOCH_SECONDS));
}

export function epochStartMs(epoch: number): number {
  return GENESIS_MS + epoch * EPOCH_SECONDS * 1000;
}

/** Annualised multiple implied by the per-epoch rate. */
export const YEARLY_MULTIPLE = Math.pow(1 + REBASE_RATE, EPOCHS_PER_YEAR);
export const APY_PERCENT = (YEARLY_MULTIPLE - 1) * 100;

export type Quote = {
  /** USDG in, before fee. */
  payGross: number;
  fee: number;
  /** USDG that actually reaches the curve. */
  net: number;
  /** Shares moved. */
  shares: number;
  /** Displayed OMER moved. */
  omer: number;
  /** Effective price per displayed OMER. */
  effectivePrice: number;
  /** Effective price against spot. Mostly the fee, not the curve. */
  priceImpact: number;
  /** How far the trade actually walks the curve. Signed. */
  curveMove: number;
};

export function quoteBuy(s: number, index: number, payGross: number): Quote {
  const fee = payGross * FEE_RATE;
  const net = payGross - fee;
  const shares = net > 0 ? sharesForDeposit(s, net) : 0;
  const omer = shares * index;
  const spot = pricePerShare(s) / index;
  const effectivePrice = omer > 0 ? payGross / omer : spot;
  return {
    payGross,
    fee,
    net,
    shares,
    omer,
    effectivePrice,
    priceImpact: spot > 0 ? effectivePrice / spot - 1 : 0,
    curveMove: s > 0 ? shares / s : 0,
  };
}

export function quoteSell(s: number, index: number, sellOmer: number): Quote {
  const shares = index > 0 ? sellOmer / index : 0;
  const gross = proceedsForShares(s, Math.min(shares, s));
  const fee = gross * FEE_RATE;
  const net = gross - fee;
  const spot = pricePerShare(s) / index;
  const effectivePrice = sellOmer > 0 ? net / sellOmer : spot;
  return {
    payGross: gross,
    fee,
    net,
    shares,
    omer: sellOmer,
    effectivePrice,
    priceImpact: spot > 0 ? effectivePrice / spot - 1 : 0,
    curveMove: s > 0 ? -Math.min(shares, s) / s : 0,
  };
}

/** Reference rate for the ETH denomination toggle on the order desk. */
export const ETH_USD = 2940;
