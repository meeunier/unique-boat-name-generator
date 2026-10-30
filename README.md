# unique-boat-name-generator

Funny nautical pseudonyms for apps that hand out display names automatically.

```
Pier Pressure · Knot My Problem · Liquid Asset · Latitude Adjustment
Technically Afloat · Tax-Deductible Walrus · Navigator Wrong Turn · Dignity Overboard
```

- **Curated jokes**: 383 boat names hand-picked from 213,875 real US-documented
  vessel names, plus a few originals. Exact wording preserved.
- **Designed templates**: 10 templates with hand-picked slot lists (1,340
  combinations), each reviewed so that every combination reads as a joke.
- **Safe to auto-assign**: no explicit, crude, cruel, political, religious or
  drug content. Borderline jokes (innuendo, booze, "Ship Happens") are left out.
- **Offline and tiny**: zero dependencies, no network, no filesystem, no AI at
  runtime. About 10 kB gzipped. Works in React Native (Hermes/JSC), browsers,
  Node ≥ 18, ESM and CommonJS.
- **Seedable**: reproducible output for a given seed and dictionary version.

## Install

```bash
npm install unique-boat-name-generator
```

## Quick start

```ts
import { generateName, generateNames } from 'unique-boat-name-generator';

const name = generateName();
// {
//   display: 'Pier Pressure',
//   base: 'Pier Pressure',
//   username: 'pierpressure',
//   suffix: null,
//   source: 'curated',
//   template: null,
//   dictionaryVersion: '2026.10.1'
// }

generateNames(3, { suffix: true, separator: '_' }).map((n) => n.username);
// ['to_be_named_later69', 'savings_overboard40', 'reportedly_below_deck39']
```

## API

### `generateName(options?) → NautiName`
### `generateNames(count, options?) → NautiName[]`

`generateNames` never returns two names with the same username in one batch.

| Option | Default | |
| --- | --- | --- |
| `seed` | — | String or number. Same seed + options + `DICTIONARY_VERSION` → same output. `0` is a valid seed. |
| `random` | `Math.random` | Custom `() => number` in [0, 1), e.g. crypto-backed. Ignored if `seed` is set. |
| `source` | `'mixed'` | `'curated'`, `'template'` or `'mixed'`. |
| `curatedShare` | `0.5` | Share of curated phrases in `'mixed'` mode. |
| `suffix` | `false` | `true` appends 10–99 ("Pier Pressure 42"), or pass `{ min, max }`. |
| `separator` | `''` | Username word separator: `''`, `'_'`, `'-'` or `'.'`. |
| `exclude` | — | Names to skip (e.g. already taken). Matched by username, so any spelling works. |
| `partial` | `false` | *(batch only)* Return fewer names instead of throwing when the request exceeds capacity. |

A `NautiName` has `display` (readable, includes the suffix), `base` (phrase
only), `username` (compact ASCII), `suffix`, `source`, `template` and
`dictionaryVersion`.

### `capacity(options?) → number`

How many distinct names the options can produce:

| Options | Distinct names |
| --- | --- |
| `{ source: 'curated' }` | 383 |
| `{ source: 'template' }` | 1,340 |
| default (`'mixed'`) | 1,723 |
| `{ suffix: true }` (10–99) | 155,070 |
| `{ suffix: { min: 1000, max: 9999 } }` | 15,507,000 |

If you ask for more than `capacity()`, `generateNames` throws a
`NameCapacityError` (with `.requested` and `.available`) unless
`partial: true`. With suffixes, every phrase is used once before any phrase
repeats with a different number, so batches stay varied.

### `nameStream(options?)`

A lazy iterator over distinct names that ends after exactly `capacity()`
names. `generateName({ seed })` equals the first item of
`nameStream({ seed })`.

### `claimName(tryClaim, options?) → Promise<NautiName>`

Helper for reserving a name in your own registry (see below).

### `toUsername(display, { separator?, suffix? })`

`"Kids' Inheritance"` → `"kidsinheritance"`; `"Log Off, Lake On"` with `'-'` → `"log-off-lake-on"`.

Also exported: `CURATED_NAMES`, `TEMPLATES`, `DICTIONARY_VERSION`, `seededRandom`.

## Random is not unique

This package generates names **randomly**. It guarantees no repeats **within
one batch or stream**, and nothing more. Two devices, two server processes or
two seeds can produce the same name. There are 1,723 base names, so without
suffixes collisions become likely after a few dozen users (the birthday
problem).

**Global uniqueness needs a registry**, meaning your database:

1. Put a `UNIQUE` constraint on the normalized username (`username` is already
   lowercase ASCII, so a plain unique index works).
2. Generate a candidate and try to insert it. The insert *is* the reservation,
   so check-then-insert races are impossible.
3. On a unique-violation, try another name. After a few collisions, switch to
   suffixed names, which have far more room.

`claimName` does steps 2–3:

```ts
import { claimName } from 'unique-boat-name-generator';

const name = await claimName(async (candidate) => {
  try {
    await db.query(
      'INSERT INTO profiles (id, pseudonym, username) VALUES ($1, $2, $3)',
      [userId, candidate.display, candidate.username],
    );
    return true; // reserved
  } catch (e) {
    if (isUniqueViolation(e)) return false; // taken, try another
    throw e; // real errors propagate
  }
}, { suffixAfter: 5, attempts: 20 });
```

Candidates never repeat within a call. The first `suffixAfter` attempts use
plain names, and later attempts add a suffix (10–99 unless you pass `suffix`).
If every attempt collides it throws `NameClaimError`. For large user bases,
pass `suffix: { min: 1000, max: 9999 }` from the start, or seed the call with
names you know are taken via `exclude`.

## Store names; don't re-derive them

Generate a name **once**, store `display` and `username` on the user record,
and treat it as data from then on.

- The pseudonym is a **display label**. Keep UUIDs, account IDs and
  installation IDs as separate technical identifiers, and never key data on
  the pseudonym.
- **Dictionary updates never rename anyone**, because nothing re-generates
  stored names.
- **Seeded output is reproducible only within one `DICTIONARY_VERSION`.**
  Adding, removing or reordering phrases or template words, or changing the
  selection algorithm, changes what a seed produces. Such changes bump
  `DICTIONARY_VERSION` and ship as a minor release (0.x: minor), never a
  patch. If you rely on seeds (e.g. a deterministic preview before an
  account exists), store `dictionaryVersion` alongside, or pin the package
  version.
- Don't use emails or other personal data as seeds. Seeds are not secret, and
  the name would be derivable from the email.

## React Native

See [`examples/react-native/`](examples/react-native/): an anonymous user
gets a pseudonym on first launch (reserved on the server with `claimName`)
and keeps it after verifying an email later. The server attaches the email to
the existing profile row, so the pseudonym and user ID don't change. The
installation UUID stays a separate technical identifier.

No polyfills are needed: the code targets ES2019, uses no `crypto`, `Intl`,
`Buffer`, private class fields or BigInt, and seeded output is identical on
Hermes, JSC and V8.

## Where the names come from

The curated phrases were selected from the
[boat-names-dataset](https://github.com/msquaremarinesolutions-create/boat-names-dataset)
(M.Square Marine, MIT), which is derived from the U.S. Coast Guard's
*Merchant Vessels of the United States* (public domain). Only vessel names
were used. The selection process (automated filtering of 163,906 normalized
names, then editorial review of 18,707 candidates) is documented in
[`research/`](research/), together with every retained name's original
source spellings, a one-line explanation of its joke, and the borderline
names held back. None of this research data is included in the npm package.

## Contributing names

Add a name to `research/editorial/curated.json` (with `joke`, `category` and
`provenance`), run `npm run data`, bump `DICTIONARY_VERSION`, update the
fingerprint in `test/data.test.ts` and the pinned output in
`test/generator.test.ts`, and add a CHANGELOG entry. The bar: would a
stranger smile on being assigned it, and would nobody be embarrassed?

## License

MIT. See [LICENSE](LICENSE) and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)
(data provenance; algorithm credits; acknowledgement of
[unique-names-generator](https://github.com/andreasonny83/unique-names-generator),
whose API was a reference, though no code was copied).
