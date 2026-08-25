/**
 * Nothing about OMER's parameters is settled until it is deployed, and a figure
 * on a pre-launch page reads as a commitment whether or not it was meant as
 * one. So every number that describes the deal goes through here: the real
 * value once a contract is wired up, `TBA` before that.
 *
 * The mechanism is still described in full. It is only the figures that wait.
 */

import { IS_LIVE } from "./protocol";
import { num, pct, pctFine, usd, usdPrecise } from "./format";

export const TBA = "TBA";

export const usdT = (v: number, decimals = 0) =>
  IS_LIVE ? usd(v, decimals) : TBA;

export const usdPreciseT = (v: number) => (IS_LIVE ? usdPrecise(v) : TBA);

export const numT = (v: number, decimals = 2) =>
  IS_LIVE ? num(v, decimals) : TBA;

export const pctT = (v: number, decimals = 2) =>
  IS_LIVE ? pct(v, decimals) : TBA;

export const pctFineT = (v: number) => (IS_LIVE ? pctFine(v) : TBA);

export const rawT = (v: string) => (IS_LIVE ? v : TBA);
