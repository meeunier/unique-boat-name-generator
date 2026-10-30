import { describe, expect, it } from 'vitest';
import { NameClaimError, claimName, generateNames, type NautiName } from '../src/index.js';

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
    const tried: NautiName[] = [];
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
});
