# Editorial rubric — funny boat names for auto-assigned pseudonyms

Every retained name may be **assigned automatically** to a stranger as their public
display name in a boating app (think "You are now known as Pier Pressure"). Judge each
name by: would a random boater smile on receiving it, and would nobody be embarrassed?

## Keep (default collection) — needs ALL of:
1. **Actually funny or clever**: nautical wordplay (Knot My Problem, Pier Pressure, Seas
   the Day), unexpected phrases, dry humour (Kids' Inheritance, Liquid Asset), mild
   absurdity, ironic boat-owner self-awareness (Reel Therapy, Exit Strategy). The joke
   must be legible from the words alone to an English-speaking boater.
2. **Works as a person's pseudonym**: reads fine as "Hi, I'm ___". Names about the boat
   owner's spouse/ex ("Wife's Idea", "Alimony") can still be fine if gentle; names that
   assert something about the recipient's body, sexuality, intelligence or vices are not.
3. **Safe**: no explicit sexual reference, no slurs, no cruelty, no drug use, no
   religion/politics, no death/drowning/shipwreck humour, no profanity (even
   disguised: "Ship Happens", "What the Hull" -> borderline, not keep).
4. **Not generic**: elegant/sentimental names (Serenity, Sea Breeze, Island Girl,
   Second Wind, Carpe Diem) are NOT funny — reject them. Plain song titles, people's
   names, company/fleet names (AEP 101, KIRBY), and foreign phrases with no pun — reject.
5. **Not broken**: reject truncated names (cut at 33 chars), garbled spellings, joke
   only works with a private backstory, or the pun is so strained it needs explaining.

## Borderline (separate list, for the product owner's judgment):
- Mild innuendo that's probably OK but could embarrass someone: Nauti Buoy, Reel Nauti,
  Wet Dream-adjacent, "Hooker" fishing puns, Seamen puns.
- Alcohol jokes (Pour Decisions, Happy Ours, Shaken Knot Stirred) — funny but a heavy
  drinking theme may be unwanted for auto-assignment.
- Disguised profanity (Ship Happens, What the Hull, Sheet Happens).
- Gentle digs at spouses/marriage (Alimony, Her Idea, Wife's Fault).
- Dark-ish but mild (Unsinkable II, Titanic II).
Do NOT put explicit or slur content in borderline — just reject it.

## Variant handling
Many entries are variants of one joke (KNOT FOR SAIL / KNOT 4 SAIL / KNOT FOR SALE).
Keep the clearest spelling only; note the others in `variants`. Mark numbers-for-words
(KNOT 2 BAD) as variants of the worded form unless the number IS the joke.
The KNOT / REEL / SEA puns are extremely common — only keep ones that are clearly good,
not every "KNOT <anything>".

## Output
Write JSONL, one object per kept or borderline name (do not output rejects):
{"key": "<key column>", "name": "<Title Case Display Name>", "decision": "keep"|"borderline",
 "category": "<one of the categories below>", "joke": "<<= 15 words explaining the joke>",
 "variants": ["<other keys from your chunk that are the same joke>"], "reason": "<for borderline: why>"}

Title Case rules: capitalise words normally ("Knot My Problem", "Seas the Day",
"Kids' Inheritance") — restore apostrophes where obviously intended.

Categories:
- `knot-puns` — not/knot
- `reel-puns` — real/reel and other fishing-tackle puns
- `sea-puns` — see/sea, C, -sea endings
- `dock-and-mooring` — pier, moor, dock, berth, buoy, anchor puns
- `boat-parts` — stern, hull, keel, bow, helm, sail, oar, wake puns
- `fishy` — fish and sea-creature puns
- `money-pit` — boat-ownership-is-expensive humour
- `day-job` — escaping work, on call, office jokes
- `life-at-sea` — weather, tides, waves, nautical life puns
- `dry-humour` — deadpan, ironic, absurd phrases without a nautical pun
- `household` — spouse/family/permission jokes
- `pop-culture` — gentle references (movies, idioms twisted)

Expect to keep only a few percent of what you read. Quality over quantity.
