import { describe, expect, it } from 'vitest';
import {
  DICTIONARY_VERSION,
  NameCapacityError,
  capacity,
  generateName,
  generateNames,
  nameStream,
  toUsername,
} from '../src/index.js';
import { hashSeed, mulberry32 } from '../src/rng.js';

describe('rng', () => {
  it('mulberry32 is deterministic', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    for (let i = 0; i < 100; i++) expect(a()).toBe(b());
  });

  it('string seeds that are anagrams hash differently', () => {
    expect(hashSeed('abc')).not.toBe(hashSeed('cba'));
    expect(hashSeed('user-1')).not.toBe(hashSeed('user-2'));
    expect(hashSeed(1)).not.toBe(hashSeed('1'));
  });

  it('seed 0 is a real seed, not "no seed"', () => {
    expect(generateNames(10, { seed: 0 })).toEqual(generateNames(10, { seed: 0 }));
  });
});

describe('generateName', () => {
  it('returns a well-formed name', () => {
    const n = generateName();
    expect(n.display).toBe(n.base);
    expect(n.suffix).toBeNull();
    expect(n.username).toBe(toUsername(n.base));
    expect(n.username).toMatch(/^[a-z0-9]+$/);
    expect(n.dictionaryVersion).toBe(DICTIONARY_VERSION);
    expect(['curated', 'template']).toContain(n.source);
  });

  it('is reproducible with a seed and equals the first name of a seeded batch', () => {
    const a = generateName({ seed: 'device-123' });
    expect(generateName({ seed: 'device-123' })).toEqual(a);
    expect(generateNames(5, { seed: 'device-123' })[0]).toEqual(a);
  });

  it('different seeds usually give different names', () => {
    const names = new Set(Array.from({ length: 200 }, (_, i) => generateName({ seed: `s${i}` }).display));
    expect(names.size).toBeGreaterThan(150);
  });

  it('respects source', () => {
    for (let i = 0; i < 50; i++) {
      expect(generateName({ seed: i, source: 'curated' }).source).toBe('curated');
      const t = generateName({ seed: i, source: 'template' });
      expect(t.source).toBe('template');
      expect(t.template).toBeTruthy();
    }
  });

  it('curatedShare steers the mix', () => {
    const batch = generateNames(400, { seed: 'mix', curatedShare: 0.8 });
    const curated = batch.filter((n) => n.source === 'curated').length;
    expect(curated).toBeGreaterThan(260);
    expect(curated).toBeLessThan(380);
  });

  it('uses a custom random source', () => {
    let i = 0;
    const seq = [0.1, 0.5, 0.9, 0.3, 0.7];
    const random = () => seq[i++ % seq.length]!;
    const a = generateName({ random });
    i = 0;
    expect(generateName({ random })).toEqual(a);
  });

  it('rejects broken random sources', () => {
    expect(() => generateName({ random: () => 1 })).toThrow(RangeError);
    expect(() => generateName({ random: () => NaN })).toThrow(RangeError);
  });
});

describe('suffixes and usernames', () => {
  it('appends a suffix within the range', () => {
    for (const n of generateNames(300, { seed: 'sfx', suffix: true })) {
      expect(n.suffix).toBeGreaterThanOrEqual(10);
      expect(n.suffix).toBeLessThanOrEqual(99);
      expect(n.display).toBe(`${n.base} ${n.suffix}`);
      expect(n.username).toBe(`${toUsername(n.base)}${n.suffix}`);
    }
  });

  it('supports custom ranges and separators', () => {
    const n = generateName({ seed: 'x', suffix: { min: 1000, max: 9999 }, separator: '_' });
    expect(n.suffix).toBeGreaterThanOrEqual(1000);
    expect(n.username).toMatch(/^[a-z0-9]+(_[a-z0-9]+)*\d{4}$/);
  });

  it('validates suffix ranges', () => {
    expect(() => generateName({ suffix: { min: 5, max: 4 } })).toThrow(RangeError);
    expect(() => generateName({ suffix: { min: -1 } })).toThrow(RangeError);
    expect(() => generateName({ suffix: { min: 1.5 } })).toThrow(RangeError);
  });

  it('formats usernames', () => {
    expect(toUsername("Kids' Inheritance")).toBe('kidsinheritance');
    expect(toUsername('Log Off, Lake On', { separator: '-' })).toBe('log-off-lake-on');
    expect(toUsername('404 Knot Ashore', { separator: '.' })).toBe('404.knot.ashore');
    expect(toUsername('Bed, Bass & Beyond', { separator: '_', suffix: 7 })).toBe('bed_bass_beyond7');
    expect(toUsername('M.T. Pockets')).toBe('mtpockets');
  });
});

describe('batches', () => {
  it('never repeats a name within a batch', () => {
    const batch = generateNames(1000, { seed: 'b' });
    expect(new Set(batch.map((n) => n.username)).size).toBe(1000);
  });

  it('can drain the whole space exactly once', () => {
    const total = capacity();
    const all = generateNames(total, { seed: 'all' });
    expect(new Set(all.map((n) => n.display)).size).toBe(total);
  });

  it('spreads phrases before repeating them with another suffix', () => {
    const bases = capacity();
    const batch = generateNames(bases, { seed: 'spread', suffix: true });
    expect(new Set(batch.map((n) => n.base)).size).toBe(bases);
  });

  it('suffix capacity is bases x range, and is fully reachable', () => {
    const opts = { source: 'curated' as const, suffix: { min: 1, max: 3 } };
    expect(capacity(opts)).toBe(capacity({ source: 'curated' }) * 3);
    const all = generateNames(capacity(opts), { ...opts, seed: 'full' });
    expect(new Set(all.map((n) => n.username)).size).toBe(capacity(opts));
  });

  it('throws NameCapacityError when asking for more than exists', () => {
    const max = capacity({ source: 'curated' });
    let err: unknown;
    try {
      generateNames(max + 1, { source: 'curated' });
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(NameCapacityError);
    expect((err as NameCapacityError).requested).toBe(max + 1);
    expect((err as NameCapacityError).available).toBe(max);
  });

  it('returns what is available with partial: true', () => {
    const max = capacity({ source: 'curated' });
    expect(generateNames(max + 50, { source: 'curated', partial: true })).toHaveLength(max);
  });

  it('skips excluded names, matching any spelling of the username', () => {
    const taken = generateNames(50, { seed: 'taken' });
    const exclude = taken.map((n, i) => (i % 2 ? n.display : n.username.toUpperCase()));
    const fresh = generateNames(capacity() - 50, { seed: 'other', exclude });
    const takenSet = new Set(taken.map((n) => n.username));
    expect(fresh.some((n) => takenSet.has(n.username))).toBe(false);
    expect(() => generateNames(capacity() - 49, { exclude })).toThrow(NameCapacityError);
  });

  it('seeded batches are reproducible', () => {
    expect(generateNames(100, { seed: 'r', suffix: true })).toEqual(generateNames(100, { seed: 'r', suffix: true }));
  });

  it('handles count 0 and rejects bad counts', () => {
    expect(generateNames(0)).toEqual([]);
    expect(() => generateNames(-1)).toThrow(RangeError);
    expect(() => generateNames(1.5)).toThrow(RangeError);
  });

  it('nameStream is lazy', () => {
    const it = nameStream({ seed: 'lazy' });
    const first = it.next();
    expect(first.done).toBe(false);
    expect(first.value).toEqual(generateName({ seed: 'lazy' }));
  });
});

describe('seeded output stability', () => {
  // Pinned output for this dictionary version. If DICTIONARY_VERSION changes,
  // update these; if they change WITHOUT a version bump, something is wrong.
  it(`is stable for dictionary ${DICTIONARY_VERSION}`, () => {
    expect(generateNames(5, { seed: 'golden' }).map((n) => n.display)).toMatchInlineSnapshot(`
      [
        "Rock Around the Dock",
        "Non Cents",
        "Self-Taught Seahorse",
        "A Boat Time",
        "Had Money",
      ]
    `);
    expect(generateName({ seed: 'golden', suffix: true }).username).toMatchInlineSnapshot(`"rockaroundthedock40"`);
  });
});
