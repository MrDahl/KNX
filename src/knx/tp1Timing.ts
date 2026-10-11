import type { TelegramParams } from '../types';

// KNX TP1 v01.02.02 §§2.3.1–2.3.2, Figures 38–41 and Annex B.
// All intervals start/end at character boundaries (including the stop bit).
export const BIT_US = 1e6 / 9600;
export type NextAccess = Pick<TelegramParams, 'priority' | 'repeatFlag'>;
export const DEFAULT_NEXT_ACCESS: NextAccess = { priority: '11', repeatFlag: '1' };
export function accessWaitBits({ priority, repeatFlag }: NextAccess) {
  return repeatFlag === '0' || priority === '00' || priority === '10' ? 50 : 53;
}
export function telegramTiming(octets: number, nextAccess: NextAccess = DEFAULT_NEXT_ACCESS) {
  if (!Number.isInteger(octets) || octets < 0) throw Error('Invalid character count.');
  const bitMs = BIT_US / 1000;
  const frameBits = octets * 11 + Math.max(0, octets - 1) * 2;
  const exchangeBits = frameBits + 15 + 11;
  const idleBits = accessWaitBits(nextAccess);
  return { frameBits, frameMs: frameBits * bitMs,
    ackGapMs: 15 * bitMs, ackMs: 11 * bitMs,
    exchangeBits, exchangeMs: exchangeBits * bitMs,
    idleBits, idleMs: idleBits * bitMs,
    earliestNextMs: (exchangeBits + idleBits) * bitMs };
}
