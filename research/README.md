# Research and editorial record (not shipped)

Everything here is excluded from the npm package (`files` in package.json).
It documents where the bundled names came from and how they were chosen.

## Source

[boat-names-dataset](https://github.com/msquaremarinesolutions-create/boat-names-dataset)
release 2026.08 (commit `d25598589f3777f0283c4589da2fd4a01b801500`, cloned
with git; nothing was scraped from rendered pages). `data/vessels.csv` has
395,728 USCG-documented vessels. Only the `vessel_name` column was read. See
`../THIRD_PARTY_NOTICES.md` for licensing.

## Pipeline

| Step | Script | Result |
| --- | --- | --- |
| 1 | `01_extract.py` | 213,875 distinct raw names → 163,906 groups after normalizing whitespace, case, punctuation and numbered or inherited duplicates (`KNOT ON CALL II`, `KNOT ON-CALL`, `KNOT ON CALL 2` are one group). Every source spelling is kept with its vessel count. |
| 2 | `02_candidates.py` | Regex scoring for nautical wordplay (knot/not, reel/real, pier/peer…), money-pit and day-job humour, plus content flags (sexual, profanity, slurs, alcohol/drugs, dark, politics/religion). 8,840 candidates. A second stream of 9,867 popular multi-word names (≥3 vessels) with no lexicon hit was also reviewed, because many good jokes use no nautical word (Exit Strategy, Flight Risk). |
| 3 | first-pass review → `03_merge_reviews.py` | All 18,707 rows were read against `editorial/RUBRIC.md`, in six parallel batches. 633 keep, 166 borderline, everything else rejected. Raw decisions are in `editorial/first-pass/`. |
| 4 | `04_finalize.py` | Final editorial pass: one canonical spelling per joke, capped near-duplicates (e.g. 4 spellings of Fishful Thinking, 3 of Kids' Inheritance; Knot Working kept, Knot Work / Knot at Work / Still Knot Working cut), and pseudonym fitness. **382 retained** from the dataset plus 1 original. 218 first-pass keeps rejected (`editorial/rejected_first_pass_keeps.json`), 159 borderline (`editorial/borderline.json`). |
| 5 | `05_build_runtime_data.py` | Writes display strings only to `src/data/phrases.ts`. |

To reproduce: clone the dataset, then

```bash
python3 -I research/scripts/01_extract.py path/to/vessels.csv research/work
python3 -I research/scripts/02_candidates.py research/work
# split candidates + popular_unmatched into review chunks, review, write work/review/*.out.jsonl
python3 -I research/scripts/03_merge_reviews.py research/work
python3 -I research/scripts/04_finalize.py research/work research/editorial
npm run data
```

`research/work/` (intermediate JSON, ~30 MB) is git-ignored. The step-2
popular-unmatched list was produced by a short inline query: groups with
≥3 vessels, ≥2 words, no digits, and not already a candidate.

## Files

- `editorial/curated.json`: every retained name with category, joke
  explanation, provenance (`boat-names-dataset` or `original`), all source
  spellings and vessel counts.
- `editorial/borderline.json`: names held back for the product owner, with
  the reason.
- `editorial/templates.md`: why each template exists and what was cut after
  reviewing generated samples.
- `editorial/RUBRIC.md`: the review criteria.
