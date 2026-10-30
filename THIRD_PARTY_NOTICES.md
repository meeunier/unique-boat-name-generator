# Third-party notices

## Boat names: boat-names-dataset (MIT) and USCG data (public domain)

The curated phrases in `src/data/phrases.ts` were selected from the
`vessel_name` column of `data/vessels.csv` in
[boat-names-dataset](https://github.com/msquaremarinesolutions-create/boat-names-dataset)
(release 2026.08, commit `d25598589f3777f0283c4589da2fd4a01b801500`). Only
vessel names were used. No official numbers, ports, hull data or other
registry fields are included. Names were normalized (capitalization,
punctuation, spelling variants, numbered duplicates such as "II" or "2")
during editorial review.

That dataset is derived from *Merchant Vessels of the United States*,
published by the U.S. Coast Guard. As a work of the United States federal
government, the source data is in the public domain (17 U.S.C. § 105). The
repository is distributed under the following license, reproduced as
required:

```
MIT License

Copyright (c) 2026 M.Square Marine LLC

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

Note on data: the contents of data/ are derived from "Merchant Vessels of the
United States", published by the U.S. Coast Guard. As a work of the United
States federal government, the source data is in the public domain
(17 U.S.C. § 105).
```

Template phrases (`src/data/templates.ts`) and the name "Moor or Less" were
written for this project.

## Algorithms (public domain)

- **Mulberry32** PRNG by Tommy Ettinger, released into the public domain.
- **FNV-1a** hash by Glenn Fowler, Landon Curt Noll and Kiem-Phong Vo, public domain.
- **MurmurHash3 finalizer** constants by Austin Appleby, public domain.

These are independent implementations, not copied from another package.

## Acknowledgement: unique-names-generator (MIT)

[unique-names-generator](https://github.com/andreasonny83/unique-names-generator)
by AndreaSonny (MIT, © 2018–2022) was reviewed as a reference for API ideas
(dictionary-based generation, seeds, separators). **No code or dictionaries
were copied**, so its license terms do not apply to this package. It is
credited here as prior art.
