"""Step 3: merge first-pass review outputs with source provenance.

Usage: python3 -I 03_merge_reviews.py <work_dir>
Reads work/review/chunk*.out.jsonl + candidates + popular_unmatched.
Writes work/merged.json: one entry per reviewed joke with all source spellings
(of the picked key and of its variants) and vessel counts.
"""
import glob
import json
import sys


def main(work: str) -> None:
    cands = {c["key"]: c for c in json.load(open(f"{work}/candidates.json"))}
    for c in json.load(open(f"{work}/popular_unmatched.json")):
        cands.setdefault(c["key"], c)
    merged = []
    bad = 0
    for path in sorted(glob.glob(f"{work}/review/chunk*.out.jsonl")):
        for line in open(path):
            line = line.strip()
            if not line:
                continue
            r = json.loads(line)
            keys = [r["key"]] + [v for v in r.get("variants") or [] if v != r["key"]]
            if r["key"] not in cands:
                bad += 1
                continue
            sources = {}
            for k in keys:
                if k in cands:
                    for s, n in cands[k]["sources"].items():
                        sources[s] = sources.get(s, 0) + n
            merged.append(
                {
                    "key": r["key"],
                    "name": r["name"].strip(),
                    "decision": r["decision"],
                    "category": r.get("category"),
                    "joke": r.get("joke"),
                    "reason": r.get("reason") or "",
                    "variant_keys": keys[1:],
                    "source_spellings": sources,
                    "vessels": sum(sources.values()),
                    "flags": cands[r["key"]].get("flags", []),
                    "chunk": path.rsplit("/", 1)[-1],
                }
            )
    json.dump(merged, open(f"{work}/merged.json", "w"), indent=1)
    print("merged", len(merged), "bad keys", bad,
          "keep", sum(m["decision"] == "keep" for m in merged),
          "borderline", sum(m["decision"] == "borderline" for m in merged))


if __name__ == "__main__":
    main(sys.argv[1])
