# Name templates

Each template has its own word lists. Words are reviewed in that template's
context rather than combined with a shared adjective or noun list.

| Template | Example | Combinations | Construction | Weight |
| --- | --- | --- | --- | --- |
| `critter` | Tax-Deductible Walrus | 896 | 32 traits × 28 sea creatures. | 34 |
| `status` | Technically Afloat | 120 | 8 adverbs × 15 boating states. | 20 |
| `rank` | Navigator Wrong Turn | 224 | 8 ranks × 28 everyday phrases. | 16 |
| `overboard` | Dignity Overboard | 22 | An object or concern followed by “Overboard.” | 7 |
| `knot` | Knot Impressed | 20 | “Knot” in place of “not.” | 7 |
| `reel` | Reel Humble | 20 | “Reel” in place of “real” or “really.” | 6 |
| `stern` | Stern But Fair | 14 | “Stern But” followed by a trait. | 4 |
| `moor` | Moor Naps | 10 | “Moor” in place of “more.” | 3 |
| `pier` | Pier Mentor | 6 | “Pier” in place of “peer.” | 1.5 |
| `sea` | Sea You Next Tide | 8 | “Sea You” followed by a time or farewell. | 1.5 |

There are 1,340 combinations. Weights control the relative chance of choosing a
template while it still has names available. With the default mixed settings,
curated names start with a 50% selection probability. As pools run out, draws
use the remaining pools.

## Changes after sample review

The first review used one 300-name template sample and mixed samples of 200 and
100 names. It removed:

- “Honorary,” “Sleepy” and “Well-Rested” from creature traits because their
  combinations were weak. “Sunburnt” was repeated across templates.
- “Fashionably” from status adverbs because phrases such as “Fashionably Docked”
  were awkward. “Usually,” “Currently” and “Occasionally” added little humour.
- “Upwind,” “Downwind,” “In Port” and “Ashore” from status states, along with
  another repeated “Sunburnt.”
- “Tan Lines,” “Elbow Room,” “Loose Ends” and “Paperwork” from rank phrases
  because the resulting names read awkwardly.
- “Ice” from the moor template. “Moor Cowbell” remains in the curated names only.
- “Responsible,” “Sure” and “Review” from knot and pier lists because the curated
  collection already contains those jokes.

The source lists are in `src/data/templates.ts`. Tests enumerate the outputs and
check for normalized duplicates, overlap with curated names, length, blocked words
and withheld phrases. Changes to lists, patterns or weights require a dictionary
version bump.
