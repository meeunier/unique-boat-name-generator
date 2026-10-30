# Changelog

Changes to the names or selection algorithm require a dictionary version bump
and a minor package release. Patch releases preserve generated output.

## 0.2.0 — 2026-10-30

- Added a separate username dictionary with 47 playful fictional and legendary mariners.
  Username dictionary `2026.10.3` has 423,000 handles. Usernames are strings ending
  in a required random number from 1000–9999, with no separate display name.
- Added explicit boat operations and username generation, streams, capacity and
  reservation helpers. Existing generic operations remain boat aliases.
- Added side-by-side generators, a GitHub link and basic information to the demo.

- Removed eight borderline phrases from generation. Dictionary `2026.10.2` has
  375 curated names and 1,340 template combinations, for 1,715 base names.
- Changed the default username format to lowercase with underscores, including
  before suffixes: `pier_pressure`, `pier_pressure_42`. Other separators remain available.
- Renamed the result type to `BoatName`.
- Fixed exclusions passed as one-use iterators in generation and reservations.
- Changed reservation errors to report the actual number of attempts.
- Added validation for suffix ranges, retry counts, separators and random values.
- Added a browser demo and a static export for hosting at a root URL or subpath.

## 0.1.0 — initial draft, unpublished

- Added dictionary `2026.10.1`: 383 curated names and 1,340 template combinations.
- Added generation, batches, streams, capacity checks, username formatting and
  database reservation callbacks, with seeds, suffixes and exclusions.
