# Name research

This directory records the source data, selection decisions and template reviews.
It is excluded from the npm package.

## Source

The vessel names came from
[boat-names-dataset](https://github.com/msquaremarinesolutions-create/boat-names-dataset),
release `2026.08`, commit `d25598589f3777f0283c4589da2fd4a01b801500`.
Its `data/vessels.csv` contains 395,728 USCG vessel records. Only the `vessel_name`
column was used. See [third-party notices](../THIRD_PARTY_NOTICES.md) for attribution.

## Selection

| Step | Script | Result |
| --- | --- | --- |
| Extract | `01_extract.py` | 213,875 distinct spellings, grouped into 163,906 normalized names. Source spellings and vessel counts were retained. |
| Find candidates | `02_candidates.py` | 8,840 names matching wordplay or humour rules. Another 9,867 popular multiword names without a rule match were added for review. |
| First review | `03_merge_reviews.py` | Six review batches covering 18,707 candidates. There were 633 keeps and 166 borderline decisions. |
| Final selection | `04_finalize.py` | 374 dataset names and one original retained after spelling, duplicate, display-name and SFW checks. There are 167 withheld names and 218 rejected first-pass keeps. |
| Generate source | `05_build_runtime_data.py` | Writes display strings to `src/data/phrases.ts`. Editorial notes remain here. |

Normalization groups case, punctuation, spacing and numbered variants. For
example, `KNOT ON CALL II`, `KNOT ON-CALL` and `KNOT ON CALL 2` are one group.
The extra popular-name candidates had at least three vessel records, at least
two words, no digits and no match in the initial candidate list.

## Files

| File | Contents |
| --- | --- |
| [curated.json](editorial/curated.json) | Retained names, joke descriptions, provenance, spellings and counts. |
| [borderline.json](editorial/borderline.json) | Withheld names and the reason for each decision. |
| [RUBRIC.md](editorial/RUBRIC.md) | Selection criteria and review output format. |
| [SFW_REVIEW.md](editorial/SFW_REVIEW.md) | The latest SFW review and its exclusions. |
| [templates.md](editorial/templates.md) | Template lists, weights and changes. |
| [REPORT.md](editorial/REPORT.md) | Examples and a generated sample. |
| `editorial/first-pass/` | Original first-pass decisions. |
| [mariners](mariners/README.md) | Maritime character research and the explicit runtime username selection. |

## Reproduce the data

Clone the source dataset, then run:

```bash
python3 -I research/scripts/01_extract.py path/to/vessels.csv research/work
python3 -I research/scripts/02_candidates.py research/work
```

Split the candidates and popular unmatched names into review batches. Apply the
rubric and write decisions to `research/work/review/*.out.jsonl`. Then run:

```bash
python3 -I research/scripts/03_merge_reviews.py research/work
python3 -I research/scripts/04_finalize.py research/work research/editorial
npm run data
```

The review step requires editorial decisions; it is not automated by these scripts.
The original popular-name selection used an inline query with the criteria above.
Intermediate files in `research/work/` are ignored by Git. Changes to a runtime
dictionary also require a version bump and updated tests.

Username data uses `06_build_usernames.py`, which reads the explicit selection in
`mariners/username-selection.json` and generates `src/data/characters.ts`. It runs
as part of `npm run data`. Adding a character to the catalogue alone does not add
it to the generator.
