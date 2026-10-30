"""Step 4: final editorial decisions -> editorial/curated.json + borderline.json.

The first-pass review (step 3) over-collects. This file is the editor's
explicit final say:
  KEEP         - exact display names (from merged.json) in the default collection
  RENAME       - display-spelling fixes applied before matching
  TO_BORDERLINE- first-pass keeps moved to borderline, with the reason
  DROP_BORDERLINE - first-pass borderline names rejected outright
  ORIGINALS    - names written for this project (not in the dataset), marked as such
Every first-pass keep not listed in KEEP is rejected as weaker or as a
duplicate of a kept joke; those are written to rejected_keeps.json for audit.

Usage: python3 -I 04_finalize.py <work_dir> <editorial_dir>
"""
import json
import re
import sys

RENAME = {
    "Carpe Mañana": "Carpe Manana",  # runtime data stays ASCII
    "Anchor Management V": "Anchor Management",
    "Liquid Asset Too": "Liquid Asset",
    "Fishful Thinkin'": "Fishful Thinking",
    "Playin' Hooky": "Playing Hooky",
    "Keep It Reel": "Keepin' It Reel",
    "What's Up, Dock": "What's Up Dock",
    "Loan Ranger": "The Loan Ranger",
}

KEEP = """
# knot-puns
Frayed Knot | Be Knot Afrayed | Believe It or Knot | Do Knot Disturb | Driving Me Knots
Knot Again | Knot Guilty | Knot My Problem | Knot Negotiable | Knot Responsible | Knot Shore
Knot So Fast | Knot Tide Down | Knot Too Shabby | Knot a Clew | Knot for Sail | Knot in De Nile
Knot to Scale | Knotorious | Knotty and Nice | Sorry Knot Sorry | Tide the Knot
What's Knot to Love | Why Knot | Knot on Call | Knot Working | Knot Debaitable | 404 Knot Ashore
Weather Oar Knot | Moor Often Than Knot | Rode Knot Taken | Do or Do Knot | Shirley Knot
Knot in Kansas Anymore | We're Knot Getting a Boat | The Have Knots | Knot in My Pay Grade
Knot Available
# reel-puns
Fore Reel | Keepin' It Reel | Meals on Reels | Off the Hook | Reel Deal | Reel Estate | Reel Salty
Reel Therapy | Reel Time | Reelized Gains | Sir Reel | Stress Reelief | The Reel McCoy
The Struggle Is Reel | Reelsistance Is Futile | Reel Broke
# sea-puns
Bankrupt Sea | Boston Sea Party | Key of Sea | Long Time No Sea | Luna Sea | Midlife Criseas
Perpetual Mocean | Plan Sea | Plane to Sea | Sea La Vie | Sea Plus Plus | Sea Vu Play
Sea Yawl Later | Sea-esta | Seacret Agent | Seaquel | Seas the Day | Vitamin Sea | Whoopsea
Current Sea | Searenity Now | E-Fish-N-Sea | Slo-Mocean | Conference Room Sea
# dock-and-mooring
Anchor Management | Atta Buoy | Buoy Scout | Buoys and Gulls | Buoys of Summer | Comin' In Hot
Dock Dock Goose | Get Aweigh | La-Z-Buoy | Moor the Merrier | Oh Buoy | One Moor Time
Out Til Mooring | Pair o' Docs | Paper Buoy | Pier Group | Pier Pressure | Pier Review
Rock Around the Dock | Slip Aweigh | Yeah Buoy | Buoy Low Sell High
# boat-parts
Ace in the Hull | Achilles Keel | All Decked Out | Bad to the Bow | Barely a Wake | Fender Bender
Freudian Sloop | Hull in One | Hull of Fame | Hullabaloo | Ketch Ya Later | Loop Hull | Mad Props
Mast Transit | Miss Teak | Oar Whatever | Oarganized Chaos | Resail Therapy | Rhyme Oar Reason
Sail La Vie | Sail Pending | Sloop du Jour | Sole Prop | Stern Lecture | Stern Upbringing
Teak Tack Tow | The 19th Hull | The Hull Enchilada | The Hull Truth | Wake My Day
Wholesail Club | Workahullic | Worth the Wake
# day-job
Aweigh on Business | Billable Ours | Board Meeting | Branch Office | Circle Back | Class Dismissed
Docked Wages | Dot Calm | Exit Strategy | Floating Holiday | In a Sails Meeting | Lake for Work
Log Off, Lake On | Nautical Sabbatical | No Patients | No Work Zone | On the Other Line
Out of Office | Playing Hooky | Scope Creep | Shore Beats Work | Strait to Voicemail
The Defense Rests | What's a Monday? | Work-Life Buoyance | Working From Helm | Working Remotely
Yacht to Be Working | Beats Working | 7 Day Weekend
# dry-humour
A Boat Time | Amateur Hour | Be Right Back | Boatox | Carpe Manana | Cheaper Than Therapy
Completely Unnecessary | Crack of Noon | Doctor's Orders | Flight Risk | It'll Do | Left Unsupervised
Midlife Cruises | Misplaced Manatee | Miss Adventure | Miss Behavin' | Miss Conduct
My Therapist Insisted | Nacho Money | No Regerts | Not a Yacht Yet | Pair-o-Dice | Swear Jar Money
Temporary Sanity | This Side Up | To Be Named Later | Toucan Play | Unsalted and Shark Free
Water Hazard | Waterfront Property | Watertight Alibi | Weak Moment | What Was I Thinkin'
Whatever Floats Your Goat | Yacht Know Better | Yachts of Fun | Coastal Distancing
# fishy
Angler Management | Bait 'n' Switch | Bill Collector | Clickbait | Conch'd Out | Crustacean Frustration
Filet and Release | Fin Addict | Fish Tales | Fishful Thinking | Fishin' Accomplished
Fishin' Impossible | Gone Fission | Grand Fin-ally | Grouper Therapy | Just a Fluke
Kraken Up | Lone Shark | Marlin Monroe | Name That Tuna | Net Profit | Ofishal Business
One in a Marlin | Prince of Whales | Sandy Claws | Scales of Justice | Seize the Carp | Semper Fish
Sense of Porpoise | Shake 'n Bait | Shellfish | Sir Fish-a-Lot | Sole Mate | Squid Life Crisis
Squid Pro Quo | Tall Tails | The Codfather | Trout 'n' About | Tuna Kahuna | Insufishin Funds
# household
Are We There Yet | Bought Without Permission | Cheaper Than Kids | Couples Therapy | Don't Tell Mom
Forced Family Fun | Honey-Do Escape | It's for the Kids | My Brother-in-Law's Boat
Permission Granted | She Said I Could | Thanks Again Dad | The Dog House | Wife Approved
Wife Preserver | Yes Dear | Kids' Inheritance | Yours, Mine and Oars
# life-at-sea
A Riverderci | Ahoy Vey | All Paws on Deck | All Tide Up | Better Lake Than Never | Catch My Drift
Crews Control | Good Tern | Gulf Cart | Hard to Fathom | Shore Thing | Lake It Easy
Latitude Adjustment | Lightly Salted | Long Winded | No Egrets | Off Course | Once Upon a Tide
Port of Indecision | Riff Raft | Route Canal Therapy | Schooner or Later
Sound Decision | Tide Me Over | Water We Doing
# money-pit
A Crewed Interest | A Little Broker | A Loan Again | Adventure Capital | Bail Out | Bank Owned
Broke but Afloat | Bust Out Another Thousand | Captain Mortgage | College Fund | Current Asset
Debt Finder | Debt Setter | Depreciating Asset | Dollars and No Sense | Float a Loan
Floating Interest | Fuelish Pleasure | Fuelin' Around | Fully Vested | Grateful Debt | Had Money
High Maintenance | It's Only Money | Jamaica Me Broke | Just Add Money | Lien on Me | Liquid Asset
Liquidity Event | The Loan Ranger | Loan Wolf | M.T. Pockets | Moby Debt | Money Pit | Mutual Fun
Naut Deductible | Non Cents | Offshore Account | On the Hook | Overdraft | Portfolio | Salt 'n' Pauper
Second Mistake | Small Fortune | Smiles per Gallon | Sorry Kids | Sound Investment | Sticker Shock
Sudden Debt | Sworda Broke | Tax Ride Off | Trust Fun | Unstable Assets | Weigh Over Budget
Brilliant Deduction
# pop-culture
A Little Yacht Musik | Ahoy Polloi | Anchorman | Bad Buoys | Bay Tripper | Bed, Bass & Beyond
Boaty McBoatface | Buoy Vuitton | Call Me Ishmael | Das Boat | Dock Holiday | Family Tides
Fiddler on the Reef | From Pier to Eternity | Hull Lotta Love | Illuminauti | Just the Tow of Us
License to Chill | Moor Cowbell | Nautical Nonsense | New Kids on the Dock | Pulp Fishin'
Scuba Doo | Starfish Enterprise | The Big Leboatski | Tooth Ferry | Tug Life
We Whale Rock You | What's Up Dock | Where's the Reef | Yachta Yachta Yachta | Yachtzee
Yachtley Crue | Yakety Yacht | Zero Dock Thirty | We're Gonna Need a Bigger Boat
"""

TO_BORDERLINE = {
    "For the Halibut": "Disguised profanity: for the hell of it.",
    "Krill Bill": "Violent-film title pun on Kill Bill.",
    "Kumbayacht": "Religious-song reference to Kumbaya.",
    "Rhumb Runner": "Alcohol and smuggling pun on rum runner.",
    "Sailbad the Sinner": "Religious wording: sinner.",
    "Tax Seaduction": "Sexual innuendo: seduction.",
    "Tiller the Hun": "Reference to a historical conqueror; excluded under the violence policy.",
    "Zombies Can't Swim": "Death and drowning humour.",
    "Assisted Living": "Age joke; could sting an older user who receives it automatically.",
    "Seanior Moment": "Age/memory joke aimed at the recipient.",
    "Trophy Husband": "Gendered relationship joke about the recipient.",
    "Florida Man": "Implies the recipient is a tabloid-headline offender.",
    "Bait's Motel": "Psycho reference (a murder motel).",
    "Lil Yachty": "Name of a living musician.",
    "Tom's Cruise": "Name of a living actor.",
    "Hull and Oates": "Pun on a living musical duo (Hall & Oates).",
    "Nautical by Nature": "Riffs on 'Naughty by Nature'; mild innuendo.",
    "Shark Bait": "Finding Nemo nickname for a newbie; could read as a dig.",
    "Selfish": "Calls the recipient selfish (Shellfish is kept instead).",
}

# First-pass borderline names that are too crude, or duplicates, to show the owner.
DROP_BORDERLINE = {
    "Wine Knot", "Unsinkable Too", "The Ship Show", "Nauti Buoys", "Bad Asset", "Pour Decision",
    "A Hull of a Ride", "Bow Movement", "Baby Got Aft", "Batship Crazy", "Go Float Yourself",
    "Sum Beach", "Back That Aft Up", "OnlyFins", "Holy Chute", "Bull Ship", "In Deep Ship",
}

ORIGINALS = [
    {
        "name": "Moor or Less",
        "category": "dock-and-mooring",
        "joke": "'More or less', moored: a non-committal sailor.",
    },
]

MAX_LEN = 32


def norm_key(s: str) -> str:
    return re.sub(r"[^a-z0-9]", "", s.lower())


def main(work: str, editorial: str) -> None:
    merged = json.load(open(f"{work}/merged.json"))
    stats = json.load(open(f"{work}/stats.json"))
    # Combine first-pass entries that resolve to the same display name.
    by_name: dict[str, dict] = {}
    for m in merged:
        name = RENAME.get(m["name"], m["name"])
        e = by_name.get(name)
        if e is None:
            by_name[name] = e = dict(m, name=name, source_spellings={})
        for s, n in m["source_spellings"].items():
            e["source_spellings"][s] = e["source_spellings"].get(s, 0) + n
        if m["decision"] == "keep":
            e["decision"] = "keep"

    keep_names, cat = [], None
    keep_cat = {}
    for line in KEEP.strip().splitlines():
        line = line.strip()
        if line.startswith("#"):
            cat = line[1:].strip()
            continue
        for n in line.split("|"):
            n = n.strip()
            if n:
                keep_names.append(n)
                keep_cat[n] = cat

    missing = [n for n in keep_names if n not in by_name]
    if missing:
        raise SystemExit(f"KEEP names not found in merged review: {missing}")
    dupes = {n for n in keep_names if keep_names.count(n) > 1}
    if dupes:
        raise SystemExit(f"duplicate KEEP names: {dupes}")

    curated = []
    for n in keep_names:
        e = by_name[n]
        curated.append(
            {
                "name": n,
                "category": keep_cat[n],
                "joke": e["joke"],
                "provenance": "boat-names-dataset",
                "source_spellings": dict(sorted(e["source_spellings"].items(), key=lambda kv: -kv[1])),
                "vessels": sum(e["source_spellings"].values()),
            }
        )
    for o in ORIGINALS:
        curated.append(dict(o, provenance="original", source_spellings={}, vessels=0))

    keys = [norm_key(c["name"]) for c in curated]
    clash = {k for k in keys if keys.count(k) > 1}
    if clash:
        raise SystemExit(f"username-key clashes: {clash}")
    too_long = [c["name"] for c in curated if len(c["name"]) > MAX_LEN]
    if too_long:
        raise SystemExit(f"names longer than {MAX_LEN}: {too_long}")
    non_ascii = [c["name"] for c in curated if not c["name"].isascii()]
    if non_ascii:
        raise SystemExit(f"non-ASCII names: {non_ascii}")

    kept = set(keep_names)
    borderline = []
    for name, e in sorted(by_name.items()):
        if name in kept:
            continue
        if name in TO_BORDERLINE:
            reason = TO_BORDERLINE[name]
        elif e["decision"] == "borderline" and name not in DROP_BORDERLINE:
            reason = e["reason"]
        else:
            continue
        borderline.append(
            {
                "name": name,
                "category": e["category"],
                "joke": e["joke"],
                "reason": reason,
                "source_spellings": e["source_spellings"],
                "vessels": sum(e["source_spellings"].values()),
            }
        )
    unknown = set(TO_BORDERLINE) - set(by_name)
    if unknown:
        raise SystemExit(f"TO_BORDERLINE names not found: {unknown}")

    rejected = sorted(
        n for n, e in by_name.items() if e["decision"] == "keep" and n not in kept and n not in TO_BORDERLINE
    )

    json.dump(curated, open(f"{editorial}/curated.json", "w"), indent=1, ensure_ascii=False)
    json.dump(borderline, open(f"{editorial}/borderline.json", "w"), indent=1, ensure_ascii=False)
    json.dump(rejected, open(f"{editorial}/rejected_first_pass_keeps.json", "w"), indent=1, ensure_ascii=False)
    summary = {
        **stats,
        "automated_candidates": 8840,
        "popular_unmatched_reviewed": 9867,
        "first_pass_keep": sum(m["decision"] == "keep" for m in merged),
        "first_pass_borderline": sum(m["decision"] == "borderline" for m in merged),
        "retained_from_dataset": len(keep_names),
        "retained_original": len(ORIGINALS),
        "borderline": len(borderline),
        "rejected_in_final_pass": len(rejected),
    }
    json.dump(summary, open(f"{editorial}/summary.json", "w"), indent=2)
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
