/** A function returning a float in [0, 1), like Math.random. */
export type RandomSource = () => number;

/**
 * FNV-1a (32-bit) over UTF-16 code units, followed by a murmur3 finalizer so
 * that similar strings ("user-1", "user-2") land far apart. Unlike summing
 * character codes, anagrams ("abc" / "cba") hash differently.
 */
export function hashSeed(seed: string | number): number {
  const str = typeof seed === 'number' ? `n:${seed}` : `s:${seed}`;
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

/**
 * Mulberry32 PRNG (Tommy Ettinger, public domain). Small, fast, and identical
 * across JS engines, which is what makes seeded output reproducible on
 * Hermes, V8 and JavaScriptCore alike. NOT cryptographically secure.
 */
export function mulberry32(seed: number): RandomSource {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededRandom(seed: string | number): RandomSource {
  return mulberry32(hashSeed(seed));
}

/** Validated random value in [0, 1). */
export function randomFloat(rng: RandomSource): number {
  const r = rng();
  if (!(r >= 0 && r < 1)) {
    throw new RangeError('Random source must return a number in [0, 1).');
  }
  return r;
}

/** Integer in [0, n). */
export function randomInt(rng: RandomSource, n: number): number {
  return Math.floor(randomFloat(rng) * n);
}
