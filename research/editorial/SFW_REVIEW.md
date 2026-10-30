# SFW review

Dictionary `2026.10.2`, reviewed October 30, 2026.

The review moved eight of the original 383 curated names to `borderline.json`.
There are now 375 curated names and 1,340 template combinations: 1,715 base names.
Source spellings and vessel counts for the removed names remain in the record.

| Name | Reason for withholding |
| --- | --- |
| For the Halibut | Disguised profanity: “for the hell of it.” |
| Krill Bill | Reference to Kill Bill. |
| Kumbayacht | Reference to a religious song. |
| Rhumb Runner | Alcohol and smuggling reference. |
| Sailbad the Sinner | Religious wording. |
| Tax Seaduction | Sexual innuendo. |
| Tiller the Hun | Reference to a historical conqueror. |
| Zombies Can't Swim | Death and drowning humour. |

These decisions apply to automatic name assignment. Some of these phrases could
be fine in another context.

The retained names, template patterns and word lists were checked against the
[selection criteria](RUBRIC.md). Boat puns, spending jokes, household jokes and
absurd combinations remain, including “Pier Pressure,” “Kids' Inheritance,”
“Tax-Deductible Walrus” and “Captain Pocket Lint.”

`test/data.test.ts` enumerates the dictionary and checks for blocked terms and
withheld phrases. It also checks normalized duplicates, capacity, ASCII text,
length and the dictionary fingerprint. These tests catch regressions; deciding
whether a new joke is suitable still requires editorial review.

## Usernames

The default stored format is lowercase with underscores. Apostrophes are removed,
punctuation separates words, and a suffix is the last token:

```text
Kids' Inheritance   kids_inheritance
Pier Pressure 42    pier_pressure_42
```

Store `display` separately to preserve the original label. Batches and streams
avoid repeated names, and the demo excludes names already in its current list.
Unique names across users require a database constraint and an atomic reservation
through `claimName`. It switches to numeric suffixes after five failed plain-name
attempts by default and reports an error if no candidate succeeds.
