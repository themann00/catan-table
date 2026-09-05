/**
 * Random numbers. The app uses the crypto source; tests and the seeded board
 * generator use mulberry32 so results are reproducible from a seed.
 */

/** Returns a float in [0, 1). */
export type Rng = () => number;

export const cryptoRng: Rng = () => {
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return buf[0] / 4294967296;
  }
  return Math.random();
};

/** mulberry32: small, fast, good enough for shuffles. */
export function seededRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Integer in [0, n). */
export const randomInt = (rng: Rng, n: number): number => Math.floor(rng() * n);

/** Fisher-Yates, returns a new array. */
export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = randomInt(rng, i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Random 32-bit seed, printable as 8 hex characters for URLs. */
export const randomSeed = (rng: Rng = cryptoRng): number => randomInt(rng, 0x100000000);
export const seedToString = (seed: number): string => (seed >>> 0).toString(16).padStart(8, "0");
export const seedFromString = (s: string): number | null => {
  if (!/^[0-9a-fA-F]{1,8}$/.test(s)) return null;
  return parseInt(s, 16) >>> 0;
};
