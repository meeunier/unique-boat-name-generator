import { nameKey, toUsername, type UsernameSeparator } from './format.js';
import { randomFloat, randomInt, seededRandom, type RandomSource } from './rng.js';

export interface SuffixRange {
  min?: number;
  max?: number;
}

export interface SequenceOptions {
  /** Same seed, options and dictionary version produce the same output. */
  seed?: string | number;
  /** Returns a number in [0, 1). Ignored when seed is provided. */
  random?: RandomSource;
  /** Inclusive numeric range. true means 10–99. */
  suffix?: boolean | SuffixRange;
  /** Defaults to underscores, including before a numeric suffix. */
  separator?: UsernameSeparator;
  /** Display names or usernames to skip, regardless of case or separators. */
  exclude?: Iterable<string>;
}

export interface GeneratedName<Source extends string> {
  /** Readable name, including any numeric suffix. */
  display: string;
  /** Readable name before the numeric suffix. */
  base: string;
  /** Lowercase stored form, with underscores by default. */
  username: string;
  suffix: number | null;
  source: Source;
  template: string | null;
  dictionaryVersion: string;
}

export class NameCapacityError extends Error {
  readonly requested: number;
  readonly available: number;
  constructor(requested: number, available: number) {
    super(`Requested ${requested} distinct names but only ${available} are available. ` +
      'Enable or widen suffix, or pass partial: true to accept fewer.');
    this.name = 'NameCapacityError';
    this.requested = requested;
    this.available = available;
  }
}

/** Internal pool definition shared by the two generators. */
export interface NamePool<Source extends string> {
  size: number;
  weight: number;
  source: Source;
  template: string | null;
  get(index: number): string;
}

// Sparse Fisher–Yates uses memory proportional to draws, not total capacity.
class Deck {
  private swaps = new Map<number, number>();
  remaining: number;
  constructor(readonly size: number) { this.remaining = size; }
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

/** Internal factory; dictionary selection stays in each public generator module. */
export function createGenerator<Source extends string, Options extends SequenceOptions>(definition: {
  pools(options: Options): NamePool<Source>[];
  dictionaryVersion: string;
}) {
  function resolve(options: Options) {
    const suffixOption = options.suffix ?? false;
    let suffixMin = 0;
    let suffixCount = 1;
    if (suffixOption) {
      const range = suffixOption === true ? {} : suffixOption;
      const min = range.min ?? 10;
      const max = range.max ?? 99;
      if (!Number.isSafeInteger(min) || !Number.isSafeInteger(max) || min < 0 || max < min) {
        throw new RangeError('suffix.min and suffix.max must be safe integers with 0 <= min <= max.');
      }
      suffixMin = min;
      suffixCount = max - min + 1;
    }
    const pools = definition.pools(options);
    const total = pools.reduce((n, pool) => n + pool.size, 0) * suffixCount;
    if (!Number.isSafeInteger(total)) {
      throw new RangeError('Name capacity exceeds Number.MAX_SAFE_INTEGER. Narrow the suffix range.');
    }
    const separator = options.separator ?? '_';
    toUsername('', { separator });
    const exclude = new Set<string>();
    if (options.exclude) for (const name of options.exclude) exclude.add(nameKey(name));
    return {
      pools, total, separator, exclude, suffixMin, suffixCount,
      suffixOn: Boolean(suffixOption),
      rng: options.seed !== undefined ? seededRandom(options.seed) : options.random ?? Math.random,
    };
  }

  function capacity(options: Options = {} as Options): number {
    // Capacity is before exclusions. Do not consume a caller's one-use iterator.
    return resolve({ ...options, exclude: undefined }).total;
  }

  function* nameStream(options: Options = {} as Options): Generator<GeneratedName<Source>, void, undefined> {
    const r = resolve(options);
    const seen = new Set<string>();
    const suffixDecks = new Map<string, Deck>();
    for (let cycle = 0; cycle < r.suffixCount; cycle++) {
      const decks = r.pools.map((pool) => new Deck(pool.size));
      for (;;) {
        let totalWeight = 0;
        for (let i = 0; i < r.pools.length; i++) {
          if (decks[i]!.remaining > 0) totalWeight += r.pools[i]!.weight;
        }
        if (totalWeight <= 0) break;
        let x = randomFloat(r.rng) * totalWeight;
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
          const key = `${pi}:${index}`;
          let deck = suffixDecks.get(key);
          if (!deck) suffixDecks.set(key, (deck = new Deck(r.suffixCount)));
          suffix = r.suffixMin + deck.draw(r.rng);
        }
        const display = suffix === null ? base : `${base} ${suffix}`;
        const username = toUsername(base, { separator: r.separator, suffix });
        const key = nameKey(username);
        if (seen.has(key) || r.exclude.has(key) || r.exclude.has(nameKey(display))) continue;
        seen.add(key);
        yield {
          display, base, username, suffix,
          source: pool.source, template: pool.template,
          dictionaryVersion: definition.dictionaryVersion,
        };
      }
    }
  }

  function generateNames(count: number, options: Options & { partial?: boolean } = {} as Options): GeneratedName<Source>[] {
    if (!Number.isSafeInteger(count) || count < 0) throw new RangeError('count must be a non-negative safe integer.');
    const available = capacity(options);
    if (count > available && !options.partial) throw new NameCapacityError(count, available);
    const names: GeneratedName<Source>[] = [];
    if (count === 0) return names;
    for (const name of nameStream(options)) {
      names.push(name);
      if (names.length === count) return names;
    }
    if (!options.partial) throw new NameCapacityError(count, names.length);
    return names;
  }

  function generateName(options: Options = {} as Options): GeneratedName<Source> {
    return generateNames(1, options)[0]!;
  }
  return { capacity, nameStream, generateNames, generateName };
}
