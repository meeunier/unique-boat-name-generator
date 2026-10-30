import { describe, expect, it } from 'vitest';
import { CURATED_NAMES, DICTIONARY_VERSION, TEMPLATES, capacity, nameStream, toUsername } from '../src/index.js';
import { hashSeed } from '../src/rng.js';

const allBases = (() => {
  const out: { base: string; source: string; template: string | null }[] = [];
  for (const n of nameStream({ seed: 'enumerate' })) out.push(n);
  return out;
})();

// Words that must never appear in a generated name. Defense in depth: the
// curated list was reviewed by hand and template slots are hand-picked, but
// combinations are checked mechanically too.
const BLOCKLIST =
  /\b(sex\w*|nude|naked|boob\w*|tits?|ass|asses|dick|cock|penis|balls|screw\w*|horny|hooker\w*|semen|seamen|fuck\w*|shit\w*|damn|hell|crap|piss\w*|bitch\w*|slut\w*|whore\w*|drunk|wasted|booze|beer|wine|whiskey|rum|vodka|tequila|weed|stoned|kill\w*|dead|death|die|drown\w*|suicide|gun|nazi|retard\w*|fat|ugly|stupid|idiot|moron|dumb)\b/i;

describe('bundled data', () => {
  it('has the expected size', () => {
    expect(CURATED_NAMES.length).toBeGreaterThanOrEqual(300);
    expect(capacity()).toBe(allBases.length);
    expect(capacity({ source: 'curated' })).toBe(CURATED_NAMES.length);
  });

  it('curated names are ASCII, trimmed, short and title-cased', () => {
    for (const n of CURATED_NAMES) {
      expect(n, n).toBe(n.trim());
      expect(/^[\x20-\x7e]+$/.test(n), n).toBe(true);
      expect(n.length, n).toBeLessThanOrEqual(32);
      expect(/^[A-Z0-9'"]/.test(n), n).toBe(true);
    }
  });

  it('template slot words are ASCII, trimmed and unique within each slot', () => {
    for (const t of TEMPLATES) {
      for (const slot of t.slots) {
        expect(new Set(slot).size, t.id).toBe(slot.length);
        for (const w of slot) {
          expect(w, t.id).toBe(w.trim());
          expect(/^[A-Za-z0-9 '-]+$/.test(w), `${t.id}: ${w}`).toBe(true);
        }
      }
    }
  });

  it('every possible name is distinct by username, including across curated and templates', () => {
    const keys = new Map<string, string>();
    for (const n of allBases) {
      const k = toUsername(n.base);
      expect(keys.has(k), `${n.base} collides with ${keys.get(k)}`).toBe(false);
      keys.set(k, n.base);
    }
  });

  it('no possible name contains a blocked word', () => {
    const hits = allBases.map((n) => n.base).filter((b) => BLOCKLIST.test(b));
    expect(hits).toEqual([]);
  });

  it('every possible name fits comfortably in a UI label', () => {
    for (const n of allBases) expect(n.base.length, n.base).toBeLessThanOrEqual(32);
  });

  it('data fingerprint matches DICTIONARY_VERSION (bump the version when data changes)', () => {
    const fingerprint = hashSeed(
      JSON.stringify([CURATED_NAMES, TEMPLATES.map((t) => [t.id, t.pattern, t.slots, t.weight])]),
    );
    // If this fails you changed the dictionary: bump DICTIONARY_VERSION in
    // src/version.ts, update this map, and note it in CHANGELOG.md.
    const KNOWN: Record<string, number> = { '2026.10.1': FINGERPRINT };
    expect({ version: DICTIONARY_VERSION, fingerprint }).toEqual({
      version: DICTIONARY_VERSION,
      fingerprint: KNOWN[DICTIONARY_VERSION],
    });
  });
});

// Updated together with DICTIONARY_VERSION.
const FINGERPRINT = 1037787819;
