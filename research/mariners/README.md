# Maritime character names

Research from October 30, 2026: 212 names, comprising 175 fictional and legendary
maritime characters, 25 historical explorers and sailors, 10 related sea figures
and two advertising mascots. A 52-name shortlist suggests
possible starting names. The runtime username dictionary now selects 47
fictional and legendary mariners from the full catalogue. The selection is
explicit in [username-selection.json](username-selection.json).

Read the [catalogue](CATALOGUE.md) or edit [catalogue.json](catalogue.json).

## Scope

The main list includes captains, sailors, navigators, helmsmen, fishermen, pirates,
shipboard specialists and named voyagers. River boatmen and submarine commanders
are included. Space captains are outside the collection. Historical explorers,
sailors and mariners have a separate `historical_mariners` pool.
Passengers are generally omitted; voyage protagonists such as Caspian and
Reepicheep are listed with their actual roles.

The catalogue covers examples from novels, comics, animation, films, television,
games, mythology and folktales. English-language literature and internationally
familiar franchises are the best represented. Other sources include French,
Arabic, Japanese, Greek, Roman, Irish, Norse and Mesopotamian works and traditions.
Individual series and traditions, including One Piece and the Argonauts, are
sampled rather than fully indexed.

The 25 historical names are an editorial selection of well-known people across
early ocean exploration, polar expeditions, ocean research and solo sailing.
They are not a measured ranking of the world's most famous mariners. Each has a
source, a maritime role, a short explanation of what they are known for, aliases
where useful, and a suggested username. The existing 52-name fictional and
legendary shortlist is unchanged.

Sea figures and advertising mascots have separate lists. The Disney version of
Maui is identified as an adaptation. Brendan is listed as a historical saint with
a legendary voyage tradition. Kupe appears in the JSON boundary notes because
the cited Māori oral-history source describes an exploring ancestor.

The original shortlist remains an editorial suggestion. Runtime selection is
recorded separately and does not automatically include new research entries. Pirates and characters from violent
stories are included. Tags identify selected wording concerns, religious or
supernatural references, and antagonists; they do not describe every concern in
every story.

## Records

`catalogue.json` is the editable source. Characters appearing in several media
have one record, with adaptations or alternate names recorded as aliases.
Historical people have separate records from fictional characters inspired by
them.

| Field | Meaning |
| --- | --- |
| `id` | Stable identifier, initially matching the username base. |
| `name` | Character's or historical person's display name. |
| `aliases` | Other spellings, translations, titles or adaptation names. |
| `category` | Literature, comics/animation, film/TV, games, myth/legend, historical, sea figures or mascots. |
| `kind` | Fiction, mythology, legend, historical or mascot. |
| `work_or_tradition` | Work, series, cultural tradition or historical voyage context. |
| `role` | Maritime role or connection. |
| `pool` | `mariners`, `historical_mariners`, `sea_figures` or `mascots`. |
| `username_base` | Suggested lowercase ASCII username before a numeric suffix. |
| `tags` | Selected review notes, such as `pirate`, `wording_review` or `brand_mascot`. |
| `sources` | Keys in the source registry. |
| `shortlist` | Whether the character is in the suggested starting list. |
| `note` | Optional explanation of identity, adaptation, role or historical voyage. |

The source registry includes the title, URL, source type, consultation date and
how it was read. `search_result` means a search excerpt was consulted; it does
not mean the full page or original work was read. Primary and institutional
sources were used where available, with specialist references and Wikipedia
for additional records. Role descriptions and username suggestions were written
for this catalogue.

## Usernames

Add a number to a selected base: `captain_haddock_1234`, `captain_nemo_4782`,
`navigator_nami_2816`, `wayfinder_moana_6309`, `sinbad_8123`. Keep the correct role;
only use `captain_` for a captain.

Keep aliases on the same record. Archibald Haddock and Captain Haddock are the
same character; Sir Francis Haddock is a different character. The two Captain
Flints have different bases because they belong to different books. Dantès's
“Sinbad the Sailor” alias is separate from the Arabian Nights character.
The Flying Dutchman is usually a ship, so its captain Van der Decken has the record.

The full research catalogue has more names than the runtime collection. Use
`username-selection.json` for the current runtime selection and reserve generated
usernames through a database index as described in the [project README](../../README.md).

## Maintenance

The export was checked for unique IDs and username bases, lowercase ASCII,
a maximum of 32 characters including `_9999`, valid source keys and shortlist
membership in the main list. Counts in the JSON and Markdown agree.

Update the JSON, counts and catalogue table together. Keep aliases on an existing
record unless a source establishes a different character. New suggestions need
source checks and a content review before they can enter a runtime collection.

## Runtime usernames

`username-selection.json` selects 47 playful fictional and legendary mariners,
with cartoon, comic, comedy, adventure and game characters preferred over the
broader literary and naval catalogue. It excludes historical people, mythology entries, sea figures and mascots, and
records 12 further exclusions for wording, innuendo, religious, violent or dark
references. Pirate characters and characters from violent stories can be included
when the name itself is suitable. Selection criteria concern the generated name;
they do not endorse the character or the story.

Run `npm run data` to generate `src/data/characters.ts`. It contains only the
selected canonical handles. Roles in handles are retained from the catalogue: `navigator_nami` and `captain_haddock` are different role
choices. The source catalogue retains character display names; runtime handles
use the selected ASCII form.

Usernames always include 1000–9999, giving 423,000 combinations. Each character
appears once before the stream repeats a character with another number. Only the
final username string is returned; no display name is generated. These names need
a database reservation for uniqueness across users.

Tests check the explicit selection, source kinds, withheld IDs, normalized
collisions, SFW wording and the username dictionary fingerprint. Boat names and
usernames have independent dictionary versions.
