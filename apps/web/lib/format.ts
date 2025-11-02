import Decimal from "decimal.js";
import { format } from "date-fns";

export const LAMPORTS_PER_SOL = new Decimal(1_000_000_000);

export function lamportsToSol(lamports: Decimal.Value): Decimal {
  return new Decimal(lamports).div(LAMPORTS_PER_SOL);
}

export function solToLamports(sol: Decimal.Value): Decimal {
  return new Decimal(sol).mul(LAMPORTS_PER_SOL);
}

export function formatLamports(lamports: Decimal.Value, fractionDigits = 4): string {
  return lamportsToSol(lamports).toFixed(fractionDigits);
}

export function formatBps(bps: number): string {
  return `${(bps / 100).toFixed(2)}%`;
}

export function formatTsRange(startTs: number, endTs: number): string {
  const start = format(startTs * 1000, "PPpp");
  const end = format(endTs * 1000, "PPpp");
  return `${start} → ${end}`;
}

export function computeVestedBps(
  nowTs: number,
  tgeTs: number,
  tgeBps: number,
  cliffSec: number,
  vestingSec: number
): number {
  if (nowTs <= tgeTs) {
    return 0;
  }

  let unlocked = tgeBps;
  if (unlocked >= 10_000) {
    return 10_000;
  }

  const cliffEnd = tgeTs + cliffSec;
  if (nowTs <= cliffEnd) {
    return Math.min(10_000, unlocked);
  }

  if (vestingSec === 0) {
    return 10_000;
  }

  const elapsed = Math.min(nowTs - cliffEnd, vestingSec);
  const linearPortion = Math.floor(((10_000 - tgeBps) * elapsed) / vestingSec);
  unlocked += linearPortion;
  return Math.min(10_000, unlocked);
}
