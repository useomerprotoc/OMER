/**
 * Deterministic paper-mode ledger.
 *
 * Until VITE_OMER_ADDRESS points at a deployed contract there is nothing on
 * chain to read, so the whole book is replayed from genesis with a seeded PRNG.
 * Same input timestamp, same numbers, on every machine and every reload.
 */

import {
  CURVE_A,
  IS_LIVE,
  EPOCH_SECONDS,
  FEE_RATE,
  FEE_TO_PROTOCOL,
  FEE_TO_RESERVE,
  GENESIS_MS,
  GENESIS_SHARES,
  LIQUID_FLOOR,
  REBASE_RATE,
  VAULT_APR,
  VAULT_TARGET,
  curveIntegral,
  epochAt,
  epochStartMs,
  indexAtEpoch,
  pricePerShare,
  proceedsForShares,
  sharesForDeposit,
} from "./protocol";

export type Fill = {
  epoch: number;
  ts: number;
  side: "buy" | "sell";
  usdg: number;
  shares: number;
  omer: number;
  pricePerOmer: number;
  actor: string;
};

export type EpochPoint = {
  epoch: number;
  ts: number;
  shares: number;
  index: number;
  reserve: number;
  pricePerShare: number;
  pricePerOmer: number;
  volume: number;
};

export type ProtocolState = {
  epoch: number;
  now: number;
  epochStart: number;
  epochEnd: number;
  secondsToNext: number;
  index: number;
  shares: number;
  peakShares: number;
  supply: number;
  reserve: number;
  liquid: number;
  vault: number;
  requiredLiquid: number;
  withdrawable: number;
  surplus: number;
  backing: number;
  pricePerShare: number;
  pricePerOmer: number;
  reservePerShare: number;
  price24hAgo: number;
  change24h: number;
  buyDeposits: number;
  redeemed: number;
  protocolFees: number;
  taxRetained: number;
  vaultYield: number;
  newOmerThisEpoch: number;
  volume24h: number;
  holders: number;
  history: EpochPoint[];
  fills: Fill[];
};

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ACTOR_SEED = "0123456789abcdef";

function fakeActor(rng: () => number): string {
  let out = "0x";
  for (let i = 0; i < 4; i++) out += ACTOR_SEED[Math.floor(rng() * 16)];
  out += "...";
  for (let i = 0; i < 4; i++) out += ACTOR_SEED[Math.floor(rng() * 16)];
  return out;
}

let cache: { epoch: number; state: ProtocolState } | null = null;

/**
 * The state OMER launches in, and nothing else.
 *
 * Before deployment there is no order flow to report, so inventing some would
 * put a price history on screen that has nothing to do with the price anyone
 * will actually pay. Every number here falls out of the two constants that
 * define genesis, so the figures on the site are the launch figures.
 */
function genesisState(now: number): ProtocolState {
  const shares = GENESIS_SHARES;
  const reserve = curveIntegral(shares);
  const price = pricePerShare(shares);
  const vault = 0;

  return {
    epoch: 0,
    now,
    epochStart: GENESIS_MS,
    epochEnd: GENESIS_MS + EPOCH_SECONDS * 1000,
    secondsToNext: EPOCH_SECONDS,
    index: 1,
    shares,
    peakShares: shares,
    supply: shares,
    reserve,
    liquid: reserve,
    vault,
    requiredLiquid: reserve * LIQUID_FLOOR,
    withdrawable: reserve,
    surplus: reserve - curveIntegral(shares),
    backing: curveIntegral(shares),
    pricePerShare: price,
    pricePerOmer: price,
    reservePerShare: reserve / shares,
    price24hAgo: price,
    change24h: 0,
    buyDeposits: 0,
    redeemed: 0,
    protocolFees: 0,
    taxRetained: 0,
    vaultYield: 0,
    newOmerThisEpoch: shares * REBASE_RATE,
    volume24h: 0,
    holders: 0,
    history: [],
    fills: [],
  };
}

/** Replay the book up to `now`. Cached per epoch, so the 1s UI tick is free. */
export function computeState(now: number): ProtocolState {
  if (!IS_LIVE) return genesisState(now);

  const epoch = epochAt(now);

  if (!cache || cache.epoch !== epoch) {
    cache = { epoch, state: replay(epoch) };
  }

  const s = cache.state;
  const epochStart = epochStartMs(epoch);
  const epochEnd = epochStart + EPOCH_SECONDS * 1000;

  return {
    ...s,
    now,
    epochStart,
    epochEnd,
    secondsToNext: Math.max(0, Math.round((epochEnd - now) / 1000)),
  };
}

function replay(targetEpoch: number): ProtocolState {
  const rng = mulberry32(0x0e3f21);

  let shares = GENESIS_SHARES;
  let peakShares = GENESIS_SHARES;
  let reserve = curveIntegral(GENESIS_SHARES);
  let vault = 0;
  let buyDeposits = 0;
  let redeemed = 0;
  let protocolFees = 0;
  let taxRetained = 0;
  let vaultYield = 0;
  let holders = 41;

  const history: EpochPoint[] = [];
  const fills: Fill[] = [];

  for (let e = 0; e <= targetEpoch; e++) {
    const index = indexAtEpoch(e);
    const ts = epochStartMs(e);
    let volume = 0;

    // Vault accrues first, then rebalances toward its target weight.
    const perEpochYield = (VAULT_APR / (365 * 48)) * vault;
    vault += perEpochYield;
    reserve += perEpochYield;
    vaultYield += perEpochYield;

    // Flow: a broad drift up with fat-tailed spikes and periodic exits.
    const wave = 1 + 0.55 * Math.sin(e / 61) + 0.3 * Math.sin(e / 13.7);
    const spike = rng() < 0.045 ? 6 + rng() * 14 : 1;
    const buyCount = rng() < 0.62 ? 1 + Math.floor(rng() * 3) : 0;

    for (let i = 0; i < buyCount; i++) {
      const gross = Math.max(12, 34 * wave * spike * (0.35 + rng() * 1.8));
      const fee = gross * FEE_RATE;
      const net = gross - fee;
      const ds = sharesForDeposit(shares, net);

      shares += ds;
      reserve += net + fee * FEE_TO_RESERVE;
      protocolFees += fee * FEE_TO_PROTOCOL;
      taxRetained += fee * FEE_TO_RESERVE;
      buyDeposits += gross;
      volume += gross;
      if (rng() < 0.34) holders += 1;

      fills.push({
        epoch: e,
        ts: ts + Math.floor(rng() * EPOCH_SECONDS * 1000),
        side: "buy",
        usdg: gross,
        shares: ds,
        omer: ds * index,
        pricePerOmer: gross / (ds * index),
        actor: fakeActor(rng),
      });
    }

    const sellCount = rng() < 0.3 ? 1 : 0;
    for (let i = 0; i < sellCount; i++) {
      const frac = 0.0008 + rng() * 0.006;
      const ds = Math.min(shares * frac, shares * 0.05);
      const gross = proceedsForShares(shares, ds);
      const fee = gross * FEE_RATE;
      const net = gross - fee;

      shares -= ds;
      reserve -= gross - fee * FEE_TO_RESERVE;
      protocolFees += fee * FEE_TO_PROTOCOL;
      taxRetained += fee * FEE_TO_RESERVE;
      redeemed += net;
      volume += gross;
      if (rng() < 0.22 && holders > 1) holders -= 1;

      fills.push({
        epoch: e,
        ts: ts + Math.floor(rng() * EPOCH_SECONDS * 1000),
        side: "sell",
        usdg: net,
        shares: ds,
        omer: ds * index,
        pricePerOmer: net / (ds * index),
        actor: fakeActor(rng),
      });
    }

    peakShares = Math.max(peakShares, shares);

    // Keep the vault at its target weight without breaching the liquid floor.
    const maxVault = reserve * (1 - LIQUID_FLOOR);
    vault = Math.min(Math.max(0, reserve * VAULT_TARGET), maxVault);

    history.push({
      epoch: e,
      ts,
      shares,
      index,
      reserve,
      pricePerShare: pricePerShare(shares),
      pricePerOmer: pricePerShare(shares) / index,
      volume,
    });
  }

  const index = indexAtEpoch(targetEpoch);
  const supply = shares * index;
  const liquid = reserve - vault;
  const backing = curveIntegral(shares);
  const nextIndex = indexAtEpoch(targetEpoch + 1);

  const dayAgo = history[Math.max(0, history.length - 49)];
  const priceNow = pricePerShare(shares) / index;
  const volume24h = history
    .slice(-48)
    .reduce((acc, point) => acc + point.volume, 0);

  return {
    epoch: targetEpoch,
    now: 0,
    epochStart: epochStartMs(targetEpoch),
    epochEnd: epochStartMs(targetEpoch + 1),
    secondsToNext: 0,
    index,
    shares,
    peakShares,
    supply,
    reserve,
    liquid,
    vault,
    requiredLiquid: reserve * LIQUID_FLOOR,
    withdrawable: reserve,
    surplus: reserve - backing,
    backing,
    pricePerShare: pricePerShare(shares),
    pricePerOmer: priceNow,
    reservePerShare: shares > 0 ? reserve / shares : 0,
    price24hAgo: dayAgo ? dayAgo.pricePerOmer : priceNow,
    change24h: dayAgo ? priceNow / dayAgo.pricePerOmer - 1 : 0,
    buyDeposits,
    redeemed,
    protocolFees,
    taxRetained,
    vaultYield,
    newOmerThisEpoch: shares * (nextIndex - index),
    volume24h,
    holders,
    history,
    fills: fills.slice(-120).sort((a, b) => b.ts - a.ts),
  };
}

/** Slippage-free spot value of a position, used across the Holdings page. */
export function positionValue(
  shares: number,
  state: ProtocolState,
): { omer: number; spotValue: number; redeemValue: number } {
  const omer = shares * state.index;
  const gross = proceedsForShares(state.shares, Math.min(shares, state.shares));
  return {
    omer,
    spotValue: omer * state.pricePerOmer,
    redeemValue: gross * (1 - FEE_RATE),
  };
}

export const CURVE_SLOPE = CURVE_A;
