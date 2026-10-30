# Template design notes

Templates exist to add capacity without diluting the curated jokes. The rule:
**every slot list belongs to one template and is chosen so that every
combination works.** There is no shared "adjectives" or "nouns" pool; a word
that is funny in one frame ("Overcaffeinated" on a walrus) is often flat in
another.

| Template | Example | Size | Why it works |
| --- | --- | --- | --- |
| critter | Tax-Deductible Walrus | 32 × 28 = 896 | The anonymous-animal format (like "Anonymous Platypus"), made funny with deadpan, oddly specific traits. All traits are gentle or self-deprecating; none comments on the recipient's body or intelligence. |
| status | Technically Afloat | 8 × 15 = 120 | Reads like a status update. The hedge does the work: Technically, Allegedly, Professionally, Permanently. Includes "Underway" as a nod to the host app. |
| rank | Navigator Wrong Turn | 8 × 28 = 224 | An official title undercut by a mundane epithet. |
| overboard | Dignity Overboard | 22 | Something lost over the side; small everyday objects and abstract ones both work. |
| knot | Knot Impressed | 20 | knot = not, with states a person could be in. Complements already in the curated list (Knot Again, Knot Guilty…) are excluded. |
| reel | Reel Humble | 20 | reel = really. |
| stern | Stern But Fair | 14 | The tone example from the brief, generalized. |
| moor | Moor Naps | 10 | moor = more. |
| pier | Pier Mentor | 6 | pier = peer. Pier Review is curated, so not here. |
| sea | Sea You Next Tide | 8 | A sign-off; "Later" is excluded (curated: Sea Yawl Later). |

Weights (share of template draws): critter 34, status 20, rank 16,
overboard 7, knot 7, reel 6, stern 4, moor 3, pier 1.5, sea 1.5. In a
default mixed batch, about half the names are curated.

## Revisions after sample review

Three generated samples (300 template-only, 200 and 100 mixed) were read in
full. Changes:

- **critter traits cut:** Honorary, Sleepy, Well-Rested (flat: "Honorary
  Herring"), and Sunburnt (repeated across three templates).
- **status hedges cut:** Fashionably ("Fashionably Docked" doesn't parse),
  Usually, Currently and Occasionally (bland: "Currently Ashore").
- **status states cut:** Upwind, Downwind, In Port, Ashore (bland), Sunburnt
  (repetition).
- **rank epithets cut:** Tan Lines, Elbow Room, Loose Ends, Paperwork
  ("Navigator Loose Ends" doesn't land).
- **moor:** Ice cut (flat); Cowbell moved to curated only (Moor Cowbell).
- **knot / pier:** Responsible, Sure and Review removed because the curated
  list has the same joke (Knot Responsible, Knot Shore, Pier Review).

Tests enumerate every template output and assert it is unique by username,
disjoint from the curated list, at most 32 characters, and free of
blocklisted words.
