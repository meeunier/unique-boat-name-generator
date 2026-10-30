"""Step 1: extract distinct vessel names from the boat-names-dataset CSV.

Reads ONLY the `vessel_name` column (plus cod_status for a count); every other
registry field (official number, port, hull, ...) is discarded immediately.

Usage: python3 -I 01_extract.py <path/to/vessels.csv> <out_dir>

Outputs (in out_dir):
  groups.json  - one entry per normalized group:
                 {key, display, sources: {source_spelling: vessel_count}, total}
  stats.json   - counts for the report
"""
import csv
import json
import re
import sys
from collections import Counter, defaultdict

ROMAN_SUFFIX = re.compile(r"(?:\s+|^)(?:II|III|IV|VI|VII|VIII|IX|X|XI|XII)$")
NUM_SUFFIX = re.compile(r"(?:\s*#?\s*\d+|\s+(?:NO|NUMBER)\.?\s*\d+)$")
NUM_PREFIX = re.compile(r"^#?\d+\s+")


def clean_ws(s: str) -> str:
    return re.sub(r"\s+", " ", s).strip()


def strip_dupe_markers(s: str) -> str:
    """Remove numbered/inherited duplicate markers: 'KNOT ON CALL II', 'REEL TIME 3'."""
    prev = None
    while prev != s:
        prev = s
        s = ROMAN_SUFFIX.sub("", s).strip()
        s = NUM_SUFFIX.sub("", s).strip()
    return s


def group_key(s: str) -> str:
    """Key used to consolidate spelling variants: punctuation and spacing ignored.

    SEA'S THE DAY / SEAS THE DAY / SEASTHEDAY -> SEASTHEDAY
    """
    s = s.upper().replace("&", "AND")
    s = strip_dupe_markers(s)
    return re.sub(r"[^A-Z0-9]", "", s)


def main(src: str, out_dir: str) -> None:
    raw = Counter()
    rows = 0
    with open(src, newline="", encoding="utf-8") as f:
        for r in csv.DictReader(f):
            rows += 1
            name = clean_ws(r["vessel_name"])
            if name:
                raw[name] += 1

    groups: dict[str, dict] = defaultdict(lambda: {"sources": Counter()})
    for name, n in raw.items():
        k = group_key(name)
        if len(k) < 3:  # '#7', 'X', etc.
            continue
        groups[k]["sources"][name] += n

    out = []
    for k, g in groups.items():
        srcs = g["sources"]
        # display spelling = most common source spelling with dupe markers removed
        best = max(srcs.items(), key=lambda kv: (kv[1], -len(kv[0])))[0]
        out.append(
            {
                "key": k,
                "display": strip_dupe_markers(best),
                "sources": dict(srcs.most_common()),
                "total": sum(srcs.values()),
            }
        )
    out.sort(key=lambda g: -g["total"])
    json.dump(out, open(f"{out_dir}/groups.json", "w"), indent=0)
    stats = {
        "vessel_rows": rows,
        "distinct_raw_names": len(raw),
        "normalized_groups": len(out),
    }
    json.dump(stats, open(f"{out_dir}/stats.json", "w"), indent=2)
    print(stats)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
