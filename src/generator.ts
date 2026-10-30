import { CURATED } from './data/phrases.js';
import { TEMPLATES, type Template } from './data/templates.js';
import { nameKey, toUsername, type UsernameSeparator } from './format.js';
import { randomInt, seededRandom, type RandomSource } from './rng.js';
import { DICTIONARY_VERSION } from './version.js';

export type NameSource = 'mixed' | 'curated' | 'template';

export interface SuffixRange {
  /** Smallest suffix, inclusive. Default 10. */
  min?: number;
  /** Largest suffix, inclusive. Default 99. */
  max?: number;
}

export interface GenerateOptions {
  /**
   * Makes output reproducible: the same seed, options and DICTIONARY_VERSION
   * always give the same names. Seeds are not secret and give no uniqueness
   * guarantee; two different seeds can produce the same name.
   */
  seed?: string | number;
  /** Custom random source in [0, 1), e.g. backed by crypto. Ignored when `seed` is set. */
  random?: RandomSource;
  /** Where names come from. Default 'mixed'. */
  source?: NameSource;
  /** In 'mixed' mode, the share of curated phrases (0..1). Default 0.5. */
  curatedShare?: number;
  /** Append a number ("Pier Pressure 42"). `true` means 10–99. */
  suffix?: boolean | SuffixRange;
  /** Separator used in `username`. Default '' ("pierpressure"). */
  separator?: UsernameSeparator;
  /**
   * Names to skip, e.g. ones already taken in your database. Compared by
   * username key, so "Pier Pressure", "pier_pressure" and "pierpressure" all
   * match. Exclusions reduce the names available to a batch.
   */
  exclude?: Iterable<string>;
}

export interface BatchOptions extends GenerateOptions {
  /**
   * If the request exceeds the available names: by default a
   * NameCapacityError is thrown. With `partial: true`, every remaining name
   * is returned instead (possibly fewer than requested).
   */
  partial?: boolean;
}

export interface NautiName {
  /** Readable label, e.g. "Pier Pressure" or "Pier Pressure 42". */
  display: string;
  /** The phrase without any numeric suffix. */
  base: string;
  /** Compact form, e.g. "pierpressure42". */
  username: string;
  suffix: number | null;
  source: 'curated' | 'template';
  /** Template id for template names, e.g. "critter". */
  template: string | null;
  /** Dictionary that produced this name. Store it if you store seeds. */
  dictionaryVersion: string;
}

export class NameCapacityError extends Error {
  readonly requested: number;
  readonly available: number;
  constructor(requested: number, available: number) {
    super(
      `Requested ${requested} distinct names but only ${available} are available ` +
        'with these options. Enable or widen `suffix`, use source "mixed", ' +
        'or pass `partial: true` to accept fewer.',
    );
    this.name = 'NameCapacityError';
    this.requested = requested;
    this.available = available;
  }
}

interface Pool {
  size: number;
  weight: number;
  source: 'curated' | 'template';
  template: Template | null;
  get(index: number): string;
}

function templatePool(t: Template, weight: number): Pool {
  const size = t.slots.reduce((n, s) => n * s.length, 1);
  return {
    size,
    weight,
    source: 'template',
    template: t,
    get(index) {
      // Mixed-radix decode: last slot varies fastest.
      const words: string[] = new Array(t.slots.length);
      let rest = index;
      for (let i = t.slots.length - 1; i >= 0; i--) {
        const slot = t.slots[i]!;
        words[i] = slot[rest % slot.length]!;
        rest = Math.floor(rest / slot.length);
      }
      return t.pattern.replace(/\{(\d+)\}/g, (_, d: string) => words[Number(d)]!);
    },
  };
}

function buildPools(source: NameSource, curatedShare: number): Pool[] {
  const curated: Pool = {
    size: CURATED.length,
    weight: 0,
    source: 'curated',
    template: null,
    get: (i) => CURATED[i]!,
  };
  const totalTemplateWeight = TEMPLATES.reduce((w, t) => w + t.weight, 0);
  const templateShare = source === 'curated' ? 0 : source === 'template' ? 1 : 1 - curatedShare;
  curated.weight = source === 'curated' ? 1 : source === 'template' ? 0 : curatedShare;
  const pools: Pool[] = [];
  if (curated.weight > 0) pools.push(curated);
  if (templateShare > 0) {
    for (const t of TEMPLATES) pools.push(templatePool(t, (templateShare * t.weight) / totalTemplateWeight));
  }
  return pools;
}

/**
 * Sparse Fisher–Yates: draws distinct integers from [0, size) in random order
 * using memory proportional to the number of draws, not to `size`.
 */
class Deck {
  private swaps = new Map<number, number>();
  remaining: number;
  constructor(readonly size: number) {
    this.remaining = size;
  }
  draw(rng: RandomSource): number {
    const j = randomInt(rng, this.remaining);
    const last = this.remaining - 1;
    const picked = this.swaps.get(j) ?? j;
    this.swaps.set(j, this.swaps.get(last) ?? last);
    this.swaps.delete(last);
    this.remaining--;
    return picked;
  }
}

interface Resolved {
  rng: RandomSource;
  pools: Pool[];
  suffixMin: number;
  suffixCount: number; // 1 when suffixes are off
  suffixOn: boolean;
  separator: UsernameSeparator;
  exclude: Set<string>;
}

function resolve(options: GenerateOptions): Resolved {
  const source = options.source ?? 'mixed';
  if (source !== 'mixed' && source !== 'curated' && source !== 'template') {
    throw new TypeError(`Unknown source "${String(source)}".`);
  }
  const share = options.curatedShare ?? 0.5;
  if (!(share >= 0 && share <= 1)) throw new RangeError('curatedShare must be between 0 and 1.');

  let suffixOn = false;
  let suffixMin = 0;
  let suffixCount = 1;
  if (options.suffix) {
    const r = options.suffix === true ? {} : options.suffix;
    const min = r.min ?? 10;
    const max = r.max ?? 99;
    if (!Number.isInteger(min) || !Number.isInteger(max) || min < 0 || max < min) {
      throw new RangeError('suffix.min and suffix.max must be integers with 0 <= min <= max.');
    }
    suffixOn = true;
    suffixMin = min;
    suffixCount = max - min + 1;
  }

  const rng =
    options.seed !== undefined ? seededRandom(options.seed) : options.random ?? Math.random;
  const exclude = new Set<string>();
  if (options.exclude) for (const n of options.exclude) exclude.add(nameKey(n));

  return {
    rng,
    pools: buildPools(source, share),
    suffixMin,
    suffixCount,
    suffixOn,
    separator: options.separator ?? '',
    exclude,
  };
}

function poolsCapacity(r: Resolved): number {
  return r.pools.reduce((n, p) => n + p.size, 0) * r.suffixCount;
}

/** Number of distinct names these options can produce (before exclusions). */
export function capacity(options: GenerateOptions = {}): number {
  return poolsCapacity(resolve(options));
}

/**
 * Lazily yields distinct names until the option space is exhausted.
 *
 * Without suffixes every base phrase appears at most once. With suffixes the
 * stream goes through all base phrases once (each with a random suffix), then
 * again with a different suffix, and so on, so repeats of a phrase are rare
 * in small batches and the stream still terminates after exactly
 * capacity() names.
 */
export function* nameStream(options: GenerateOptions = {}): Generator<NautiName, void, undefined> {
  const r = resolve(options);
  const seen = new Set<string>();
  const suffixDecks = new Map<string, Deck>();

  for (let cycle = 0; cycle < r.suffixCount; cycle++) {
    const decks = r.pools.map((p) => new Deck(p.size));
    for (;;) {
      let totalWeight = 0;
      for (let i = 0; i < r.pools.length; i++) {
        if (decks[i]!.remaining > 0) totalWeight += r.pools[i]!.weight;
      }
      if (totalWeight <= 0) break;

      // Weighted choice among pools that still have names this cycle.
      let x = r.rng() * totalWeight;
      let pi = -1;
      for (let i = 0; i < r.pools.length; i++) {
        if (decks[i]!.remaining === 0) continue;
        pi = i;
        x -= r.pools[i]!.weight;
        if (x < 0) break;
      }
      const pool = r.pools[pi]!;
      const index = decks[pi]!.draw(r.rng);
      const base = pool.get(index);

      let suffix: number | null = null;
      if (r.suffixOn) {
        const k = `${pi}:${index}`;
        let d = suffixDecks.get(k);
        if (!d) suffixDecks.set(k, (d = new Deck(r.suffixCount)));
        suffix = r.suffixMin + d.draw(r.rng);
      }

      const display = suffix === null ? base : `${base} ${suffix}`;
      const key = nameKey(display);
      if (seen.has(key) || r.exclude.has(key)) continue;
      seen.add(key);

      yield {
        display,
        base,
        username: toUsername(base, { separator: r.separator, suffix }),
        suffix,
        source: pool.source,
        template: pool.template ? pool.template.id : null,
        dictionaryVersion: DICTIONARY_VERSION,
      };
    }
  }
}

/** Generate `count` distinct names. See BatchOptions for over-capacity behaviour. */
export function generateNames(count: number, options: BatchOptions = {}): NautiName[] {
  if (!Number.isInteger(count) || count < 0) throw new RangeError('count must be a non-negative integer.');
  const available = capacity(options);
  if (count > available && !options.partial) throw new NameCapacityError(count, available);

  const out: NautiName[] = [];
  if (count === 0) return out;
  for (const name of nameStream(options)) {
    out.push(name);
    if (out.length === count) return out;
  }
  // Ran out (exclusions consumed part of the space).
  if (!options.partial) throw new NameCapacityError(count, out.length);
  return out;
}

/** Generate one name. With a seed, equals generateNames(n, { seed })[0]. */
export function generateName(options: GenerateOptions = {}): NautiName {
  return generateNames(1, options)[0]!;
}
