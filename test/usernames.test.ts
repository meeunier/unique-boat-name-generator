import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  USERNAME_BASES, USERNAME_DICTIONARY_VERSION, NameCapacityError, NameClaimError,
  generateUsername, generateUsernames, usernameStream, usernameCapacity, claimUsername,
  generateBoatName, generateBoatNames, boatNameCapacity, generateName, capacity,
  toUsername,
} from '../src/index.js';
import { hashSeed } from '../src/rng.js';

const baseOf = (username: string) => username.slice(0, -5);

describe('usernames', () => {
  it('returns only a lowercase handle with a four-digit suffix', () => {
    for (const username of generateUsernames(200, { seed: 'new-users' })) {
      expect(typeof username).toBe('string');
      expect(username).toMatch(/^[a-z0-9]+(?:_[a-z0-9]+)*_[1-9]\d{3}$/);
      expect(USERNAME_BASES).toContain(baseOf(username));
    }
    expect(usernameCapacity()).toBe(USERNAME_BASES.length * 9000);
  });

  it('does not allow callers to remove or widen the required suffix', () => {
    // @ts-expect-error Unsupported options from JavaScript consumers cannot change the format.
    const username = generateUsername({ suffix: false, separator: '-', seed: 'format' });
    expect(username).toMatch(/^[a-z0-9]+(?:_[a-z0-9]+)*_[1-9]\d{3}$/);
  });

  it('can exhaust the complete space with every number from 1000–9999', () => {
    const all = generateUsernames(usernameCapacity(), { seed: 'full-username-space' });
    expect(new Set(all).size).toBe(usernameCapacity());
    expect(new Set(all.slice(0, USERNAME_BASES.length).map(baseOf)).size).toBe(USERNAME_BASES.length);
    for (const base of USERNAME_BASES) {
      const suffixes = all.filter((name) => baseOf(name) === base).map((name) => Number(name.slice(-4)));
      expect(suffixes).toHaveLength(9000);
      expect(Math.min(...suffixes)).toBe(1000);
      expect(Math.max(...suffixes)).toBe(9999);
    }
  }, 20000);

  it('matches one-use exclusions across case and separators', () => {
    const taken = generateUsernames(10, { seed: 'exclude' });
    function* excluded() { for (const name of taken) yield name.replace(/_/g, '-').toUpperCase(); }
    const exclude = excluded();
    // Reading capacity cannot consume an exclusion iterator because it has no options.
    expect(usernameCapacity()).toBe(USERNAME_BASES.length * 9000);
    const fresh = generateUsernames(10, { seed: 'exclude', exclude });
    expect(fresh.some((name) => taken.includes(name))).toBe(false);
  });

  it('reports capacity errors and supports partial batches', () => {
    expect(() => generateUsernames(usernameCapacity() + 1)).toThrow(NameCapacityError);
    expect(generateUsernames(usernameCapacity() + 1, { partial: true })).toHaveLength(usernameCapacity());
    expect(generateUsernames(0)).toEqual([]);
  }, 20000);

  it('is reproducible across single, batch and stream generation', () => {
    const options = { seed: 'new-user' };
    expect(generateUsername(options)).toBe(generateUsernames(3, options)[0]);
    expect(usernameStream(options).next().value).toBe(generateUsername(options));
    expect(generateUsernames(20, options)).toEqual(generateUsernames(20, options));
  });

  it('retains the boat API and its explicit aliases', () => {
    expect(generateBoatName({ seed: 'boats-only' })).toEqual(generateName({ seed: 'boats-only' }));
    expect(boatNameCapacity()).toBe(capacity());
    expect(generateBoatNames(100).every((name) => typeof name.display === 'string')).toBe(true);
  });
});

describe('username data review', () => {
  it('includes only the selected fictional and legendary mariners', () => {
    const catalogue = JSON.parse(readFileSync(new URL('../research/mariners/catalogue.json', import.meta.url), 'utf8'));
    const selection = JSON.parse(readFileSync(new URL('../research/mariners/username-selection.json', import.meta.url), 'utf8'));
    const entries = selection.included.map((id: string) => catalogue.entries.find((entry: { id: string }) => entry.id === id));
    expect(USERNAME_BASES).toEqual(entries.map((entry: { username_base: string }) => entry.username_base));
    for (const entry of entries) {
      expect(entry.pool).toBe('mariners');
      expect(['fiction', 'legend']).toContain(entry.kind);
      expect(selection.withheld[entry.id]).toBeUndefined();
    }
    expect(USERNAME_BASES).toContain('captain_haddock');
    expect(USERNAME_BASES).toContain('popeye');
    expect(USERNAME_BASES).not.toContain('captain_ramage');
  });

  it('has no normalized duplicates or blocked wording', () => {
    const blocked = /\b(sex\w*|titty|tits?|willy|blood|blind|cut throat|fuck\w*|shit\w*|dick|cock|semen|seamen|nazi|drunk|beer|wine|rum|kill\w*|dead|death|drown\w*|suicide|capsize|sinner)\b/i;
    const keys = new Set<string>();
    for (const base of USERNAME_BASES) {
      const key = toUsername(base, { separator: '' });
      expect(keys.has(key), base).toBe(false);
      keys.add(key);
      expect(blocked.test(base.replace(/_/g, ' ')), base).toBe(false);
      expect(`${base}_9999`.length).toBeLessThanOrEqual(32);
    }
  });

  it('pins username data and seeded output independently of boats', () => {
    expect({ version: USERNAME_DICTIONARY_VERSION, hash: hashSeed(JSON.stringify(USERNAME_BASES)) })
      .toEqual({ version: '2026.10.3', hash: 3718110303 });
    expect(generateUsernames(3, { seed: 'golden' })).toEqual(['jim_hawkins_4021', 'dashi_9664', 'ben_gunn_1841']);
  });
});

describe('username reservations', () => {
  it('retries simultaneous reservations of the same first candidate', async () => {
    const registry = new Set<string>();
    const names = await Promise.all(Array.from({ length: 12 }, () => claimUsername(async (username) => {
      await Promise.resolve();
      if (registry.has(username)) return false;
      registry.add(username);
      return true;
    }, { seed: 'concurrent-users', attempts: 20 })));
    expect(new Set(names).size).toBe(12);
    expect(names.every((name) => /_[1-9]\d{3}$/.test(name))).toBe(true);
  });

  it('skips excluded usernames and calls the callback with strings', async () => {
    const taken = generateUsernames(20, { seed: 'username-reservations' });
    function* excluded() { yield* taken; }
    const name = await claimUsername((candidate) => {
      expect(typeof candidate).toBe('string');
      expect(taken).not.toContain(candidate);
      return true;
    }, { seed: 'username-reservations', exclude: excluded() });
    expect(taken).not.toContain(name);
  });

  it('reports exhaustion and propagates backend failures', async () => {
    await expect(claimUsername(() => false, { attempts: 1 })).rejects.toBeInstanceOf(NameClaimError);
    const all = generateUsernames(usernameCapacity());
    await expect(claimUsername(() => false, { exclude: all })).rejects.toMatchObject({ attempts: 0 });
    await expect(claimUsername(() => { throw new Error('database unavailable'); })).rejects.toThrow('database unavailable');
  }, 20000);

  it('validates retry budgets', async () => {
    for (const attempts of [0, -1, 1.5, NaN, Infinity, 2 ** 53]) {
      await expect(claimUsername(() => true, { attempts })).rejects.toBeInstanceOf(RangeError);
    }
  });
});
