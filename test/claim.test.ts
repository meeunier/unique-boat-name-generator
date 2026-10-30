import { describe, expect, it } from 'vitest';
import { NameClaimError, claimName, generateNames, type BoatName } from '../src/index.js';

describe('claimName', () => {
  it('returns the first name the backend accepts', async () => {
    const tried: string[] = [];
    const name = await claimName(async (n) => {
      tried.push(n.username);
      return tried.length === 3;
    }, { seed: 'claim' });
    expect(tried).toHaveLength(3);
    expect(name.username).toBe(tried[2]);
    expect(new Set(tried).size).toBe(3);
  });

  it('switches to suffixed names after suffixAfter collisions', async () => {
    const tried: BoatName[] = [];
    const name = await claimName((n) => {
      tried.push(n);
      return n.suffix !== null;
    }, { seed: 'escalate', suffixAfter: 2 });
    expect(tried.slice(0, 2).every((n) => n.suffix === null)).toBe(true);
    expect(name.suffix).not.toBeNull();
    expect(tried).toHaveLength(3);
  });

  it('simulates a registry with real collisions', async () => {
    const registry = new Set(generateNames(1500, { seed: 'existing-users' }).map((n) => n.username));
    const name = await claimName((n) => {
      if (registry.has(n.username)) return false;
      registry.add(n.username);
      return true;
    });
    expect(registry.has(name.username)).toBe(true);
  });

  it('gives up with NameClaimError', async () => {
    await expect(claimName(() => false, { attempts: 4 })).rejects.toBeInstanceOf(NameClaimError);
  });

  it('rejects invalid retry budgets and switch thresholds', async () => {
    for (const attempts of [0, -1, 1.5, Infinity, NaN, 2 ** 53]) {
      await expect(claimName(() => true, { attempts })).rejects.toBeInstanceOf(RangeError);
    }
    for (const suffixAfter of [-1, 1.5, Infinity, NaN]) {
      await expect(claimName(() => true, { suffixAfter })).rejects.toBeInstanceOf(RangeError);
    }
  });

  it('can switch directly to suffixed names', async () => {
    const name = await claimName(() => true, { suffixAfter: 0 });
    expect(name.suffix).not.toBeNull();
    expect(name.username).toMatch(/_\d+$/);
  });

  it('propagates backend errors', async () => {
    await expect(
      claimName(() => {
        throw new Error('network down');
      }),
    ).rejects.toThrow('network down');
  });

  it('moves on to suffixes when plain names are all excluded', async () => {
    const all = generateNames(10_000, { source: 'curated', partial: true }).map((n) => n.username);
    const name = await claimName(() => true, { source: 'curated', exclude: all });
    expect(name.suffix).not.toBeNull();
  });

  it('applies one-use exclusions to both plain and suffixed attempts', async () => {
    const opts = { seed: 'both-phases', suffixAfter: 1 };
    const candidates: BoatName[] = [];
    await claimName((name) => {
      candidates.push(name);
      return candidates.length === 2;
    }, opts);
    function* excluded() { for (const name of candidates) yield name.username; }
    const tried: string[] = [];
    await claimName((name) => {
      tried.push(name.username);
      return tried.length === 2;
    }, { ...opts, exclude: excluded() });
    expect(tried.some((name) => candidates.some((candidate) => candidate.username === name))).toBe(false);
  });

  it('reserves different names when concurrent callers start with the same seed', async () => {
    const registry = new Set<string>();
    const names = await Promise.all(Array.from({ length: 12 }, () => claimName(async (name) => {
      // Simulate waiting for a database. The check and insert below are atomic,
      // just as INSERT with a UNIQUE index must be in the real registry.
      await Promise.resolve();
      if (registry.has(name.username)) return false;
      registry.add(name.username);
      return true;
    }, { seed: 'same-user-candidate', attempts: 20, suffixAfter: 2 })));
    expect(new Set(names.map((name) => name.username)).size).toBe(12);
    expect(registry.size).toBe(12);
    expect(names.some((name) => name.suffix !== null)).toBe(true);
  });

  it('reports actual attempts when the entire name space is taken', async () => {
    const total = generateNames(10_000, { source: 'curated', partial: true }).length;
    await expect(claimName(() => false, {
      source: 'curated', suffix: { min: 1, max: 1 }, attempts: total + 10,
    })).rejects.toMatchObject({ name: 'NameClaimError', attempts: total });
  });
});
