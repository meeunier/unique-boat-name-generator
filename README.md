# unique-boat-name-generator

Generate boat names and usernames from separate dictionaries. Boat names include
a display label and stored code. Usernames are lowercase strings.

```text
Pier Pressure           pier_pressure
Knot My Problem         knot_my_problem
Tax-Deductible Walrus   tax_deductible_walrus
```

Boat names use 375 selected names and 1,340 combinations from ten templates.
Usernames use 47 playful fictional and legendary mariners. Every username ends
in a random number from 1000–9999, such as `captain_haddock_4272`. The two
dictionaries are reviewed for SFW use. Withheld entries and selection decisions
are recorded in the research files.

The library has no runtime dependencies, network requests, or filesystem access.
It includes TypeScript declarations, ESM and CommonJS builds, and an optional seed
for repeatable output. Node 18 or later is required for development.

## Try it

Install from npm:

```bash
npm install unique-boat-name-generator
```

To run the demo locally, clone the repository and run:

```bash
npm ci
npm run demo
```

Open [localhost:4173](http://127.0.0.1:4173). There is one generator for boat names and
one for usernames. Boat results show both forms; username results show only the handle.
Names do not repeat within a list. Reloading starts new lists.

To create a package you can install in another project:

```bash
npm run build
npm pack
```

Install the resulting `.tgz` file with `npm install /path/to/package.tgz`.

## Generate names

```ts
import { generateBoatName, generateUsername } from 'unique-boat-name-generator';

const boat = generateBoatName();
// Example: display = 'Pier Pressure', username = 'pier_pressure'

const user = generateUsername();
// Example: 'captain_haddock_4272'
```

Use the boat generator when adding a boat and the username generator when
creating a user. The dictionaries are separate. Character handles preserve the
selected role, such as `navigator_nami`, rather than giving every character a
captain's title.

| Operation | Boat names | Usernames |
| --- | --- | --- |
| Generate one | `generateBoatName(options?)` | `generateUsername(options?)` |
| Generate a batch | `generateBoatNames(count, options?)` | `generateUsernames(count, options?)` |
| Iterate distinct names | `boatNameStream(options?)` | `usernameStream(options?)` |
| Count possible names | `boatNameCapacity(options?)` | `usernameCapacity()` |
| Reserve through your database | `claimBoatName(callback, options?)` | `claimUsername(callback, options?)` |

The original `generateName`, `generateNames`, `nameStream`, `capacity` and
`claimName` exports remain aliases for boat operations.

Boat operations accept `seed`, `random`, `exclude`, `suffix`, `separator`,
`source` and `curatedShare`. Suffixes are off by default. `source` is `'mixed'`,
`'curated'` or `'template'`, with `'mixed'` as the default. `curatedShare` starts at
`0.5`. The default separator is `'_'`; `'-'`, `'.'` and `''` are also supported.
Set `suffix: true` for 10–99 or pass an inclusive `{ min, max }` range.

Username operations accept `seed`, `random` and `exclude`. Their format is fixed:
lowercase words separated by underscores, followed by a random number from
1000–9999. `generateUsername` and `claimUsername` return a string; batches return
strings and streams yield strings. There is no separate display name or option
to remove the number.

`seed` can be a string or number, including zero. A custom `random` function must
return a number in `[0, 1)` and is ignored when a seed is provided. `exclude`
accepts an iterable of names to skip, ignoring case and separators. Both batch
operations accept `partial: true` to return fewer results when the pool is exhausted.

A `BoatName` contains `display`, `base`, `username`, `suffix`, `source`, `template`
and `dictionaryVersion`. Its `username` field is the normalized boat code;
`display` includes the suffix and `base` does not. Boat sources are `'curated'`
or `'template'`.

## Store assigned values

Store the boat's display name and code, and the user's username:

```ts
// Boat record
{ display: 'Pier Pressure', username: 'pier_pressure' }

// User record
{ username: 'captain_haddock_4272' }
```

Assign these values once and persist them. Keep user UUIDs, boat UUIDs and
installation IDs separate. Save the boat display name as generated: its
punctuation and capitalization cannot be reliably recovered from the stored code.

`toUsername` formats a boat code without generating a name:

```ts
import { toUsername } from 'unique-boat-name-generator';

toUsername("Kids' Inheritance"); // 'kids_inheritance'
toUsername('Pier Pressure', { suffix: 42 }); // 'pier_pressure_42'
toUsername('Pier Pressure', { separator: '-' }); // 'pier-pressure'
```

## Unique usernames

Batches and streams do not repeat names. Independent calls, processes and devices
can return the same name. A seed does not reserve a username.

For unique usernames across users, add a database constraint and reserve each
candidate with an atomic insert. Use the same separator in every process that
writes usernames.

```sql
CREATE UNIQUE INDEX profiles_username_unique ON profiles (username);
```

`claimUsername` tries user candidates until your callback accepts one. Use
`claimBoatName` with the same callback pattern for boat records and their own
unique constraint:

```ts
import { claimUsername } from 'unique-boat-name-generator';

const name = await claimUsername(async (username) => {
  try {
    await db.query(
      'INSERT INTO profiles (id, username) VALUES ($1, $2)',
      [userId, username],
    );
    return true;
  } catch (error) {
    if (isUsernameUniqueViolation(error)) return false;
    throw error;
  }
}, { attempts: 20 });
```

`db`, `userId` and `isUsernameUniqueViolation` belong to your application. The
error check must identify the username constraint specifically. Other database
and network errors should propagate.

`claimUsername` always includes a four-digit number. Its `attempts` option
defaults to 20. `claimBoatName` tries five plain names before adding suffixes. `suffixAfter`
controls the switch when starting without suffixes; it is ignored when suffixes
are already enabled. Boat suffix ranges can be widened with `{ min, max }`.
The username pool has a fixed capacity of 423,000; expanding it requires more
reviewed character names. Pass known taken names in `exclude` to skip them.

If no candidate succeeds, `NameClaimError.attempts` reports how many reservation
attempts were made. Candidates do not repeat within a call.

## Capacity

Capacity is measured before exclusions.

| Dictionary and options | Names |
| --- | --- |
| Boat names, default | 1,715 |
| Boat names, `{ source: 'curated' }` | 375 |
| Boat names, `{ source: 'template' }` | 1,340 |
| Boat names, `{ suffix: true }` | 154,350 |
| Usernames, 47 bases × 9,000 numbers | 423,000 |

A batch that exceeds the available names throws `NameCapacityError`, with
`requested` and `available` properties. Set `partial: true` to get the available
names instead. With suffixes enabled, every base name is tried once before a base
repeats with another number. Excluded names are skipped.

## Seeds and updates

Boat output includes `DICTIONARY_VERSION`; `USERNAME_DICTIONARY_VERSION` is
exported for callers that keep username seeds. Seeded output is repeatable within
the matching dictionary version. Changing names, template words, their order,
or the selection algorithm can change the output.
Those changes require a dictionary version bump and a minor package release.
Patch releases preserve generated output.

Store assigned names rather than regenerating them from a seed. This keeps names
unchanged when the dictionary changes. If you need to regenerate output, pin the
package version and keep the seed and dictionary version. Avoid personal data
such as email addresses as seeds; the resulting name would be predictable.

`seededRandom`, `CURATED_NAMES`, `TEMPLATES`, `USERNAME_BASES` and both dictionary
versions are also exported.

## Browser deployment

The demo runs entirely in the browser. Build static files for any host:

```bash
npm run build:demo
```

The output is in `dist/web`. For a specific URL path, include its trailing slash:

```bash
npm run build:demo -- /npm-unique-boat-name-generator/
```

Copy the contents of `dist/web` to the matching directory in your site's public
files. For the Astro site at `meunier.co`, that directory is
`public/npm-unique-boat-name-generator/`. The next site build will include the page.
No server function or npm publication is needed for the demo.

## React Native

The [React Native example](examples/react-native/) shows an anonymous profile
receiving a character username, storing it, and keeping it when an email is added
later. Its API endpoints are placeholders for your backend. The
[Node example](examples/node/users-and-boats.mjs) shows both generation operations.

The library targets ES2019 and uses no browser or Node-specific APIs. The example
also requires React, React Native, AsyncStorage and a UUID source.

## Names and contributions

The curated names were selected from
[boat-names-dataset](https://github.com/msquaremarinesolutions-create/boat-names-dataset).
It contains USCG vessel records; this project uses only vessel names. Source
spellings, counts and selection decisions are in [research](research/README.md).
Character names and canonical handles come from the separate
[mariner catalogue](research/mariners/README.md). Runtime entries are selected
explicitly in `research/mariners/username-selection.json`. Historical people,
deities, mascots and withheld entries are excluded. Research files are excluded
from the npm package.

To add or change a name, update `research/editorial/curated.json`, include its joke
and provenance, and review it against the [selection criteria](research/editorial/RUBRIC.md).
For usernames, update the character catalogue and explicit selection, then bump
the username dictionary version in the selection file. Run `npm run data`, update
the matching dictionary fingerprint and seeded snapshots, and add a changelog
entry. Boat changes require a `DICTIONARY_VERSION` bump.

Run `npm run typecheck`, `npm test` and `npm run test:package`. The package check
installs the archive in a temporary project and checks both module formats and
TypeScript declarations. See [RELEASING.md](RELEASING.md) for npm publication.

## License

MIT. See [LICENSE](LICENSE) and [third-party notices](THIRD_PARTY_NOTICES.md).
