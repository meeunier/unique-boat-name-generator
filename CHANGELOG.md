# Changelog

Dictionary changes are released as minor versions (0.x: minor) and always
bump `DICTIONARY_VERSION`; seeded output may differ between dictionary
versions. Patch releases never change the generated names.

## 0.1.0 — unreleased

- First version. Dictionary `2026.10.1`: 383 curated phrases (382 selected
  from boat-names-dataset 2026.08, 1 original) and 10 templates (1,340
  combinations), 1,723 distinct base names in total.
- `generateName`, `generateNames`, `nameStream`, `capacity`, `claimName`,
  `toUsername`; seeded generation, numeric suffixes, exclusions,
  `NameCapacityError` and `NameClaimError`.
