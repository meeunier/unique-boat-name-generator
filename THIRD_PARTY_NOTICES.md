# Third-party notices

## Vessel-name data

The curated names in `src/data/phrases.ts` came from the `vessel_name` column of
`data/vessels.csv` in
[boat-names-dataset](https://github.com/msquaremarinesolutions-create/boat-names-dataset),
release `2026.08`, commit `d25598589f3777f0283c4589da2fd4a01b801500`.
Only vessel names were used. Selection grouped spelling, case, punctuation and
numbered variants. Original spellings and counts are recorded in the research files.

The dataset comes from the U.S. Coast Guard's *Merchant Vessels of the United
States*. Its repository includes the following license and source-data notice:

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

The templates in `src/data/templates.ts` and the name “Moor or Less” were written
for this project.

## Character names

The username dictionary contains selected fictional and legendary mariners.
The works, character identities, aliases and research sources are recorded in
`research/mariners/catalogue.json`. The runtime data contains selected canonical handles. The source works and
research descriptions are not included in the package.

## Algorithms

The following algorithms are public domain. The implementations in this
repository were written separately from the referenced name-generator package.

| Algorithm | Author |
| --- | --- |
| Mulberry32 | Tommy Ettinger |
| FNV-1a | Glenn Fowler, Landon Curt Noll and Kiem-Phong Vo |
| MurmurHash3 finalizer | Austin Appleby |

## API reference

[unique-names-generator](https://github.com/andreasonny83/unique-names-generator)
by AndreaSonny, MIT, © 2018–2022, was consulted for dictionary, seed and separator
API ideas. No code or dictionaries from that package were copied.

## Web demo assets

The demo uses Hanken Grotesk from the [Google Fonts repository](https://github.com/google/fonts/tree/main/ofl/hankengrotesk).
The font is distributed under the SIL Open Font License 1.1. Its license is
included at `examples/web/fonts/OFL.txt` and copied with the font in static exports.

The GitHub icon is adapted from [Feather](https://github.com/feathericons/feather),
under the following license:

```
The MIT License (MIT)

Copyright (c) 2013-2023 Cole Bemis

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
```
