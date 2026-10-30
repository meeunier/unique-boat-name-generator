# Name selection

These names can be assigned to someone automatically. Keep names that make sense
without a private backstory and are suitable as a public display name.

## Keep

A name needs a clear joke: a boating pun, dry humour, or an unusual combination.
Examples include “Pier Pressure,” “Kids' Inheritance,” and “Tax-Deductible Walrus.”
A nautical word by itself is not enough.

Check that it works as a display name, uses a clear spelling, and fits within
32 characters. Reject truncated text, garbled spelling and jokes that need an
explanation to be understood. Keep the explanation in the research record anyway.

Exclude explicit sexual references, slurs, targeted insults, profanity, drug use,
political or religious references, and death, drowning or shipwreck jokes. Disguised
profanity is excluded too. Do not assign a name that comments on the recipient's
body, sexuality, intelligence or vices.

Generic names such as “Serenity” and “Sea Breeze” are outside this collection.
So are personal names, fleet labels, plain song titles and foreign phrases with
no wordplay. The separate maritime-character research is not an approved runtime pool.

## Withhold for review

Record plausible but unsuitable candidates in `borderline.json`, with a reason.
This includes mild innuendo, alcohol jokes, disguised profanity, spouse-directed
jokes and mild dark humour. “Pour Decisions,” “Ship Happens” and “Unsinkable II”
are examples. Explicit or hateful entries should be rejected outright.

Gentle household jokes still need judgment. “Kids' Inheritance” is a joke about
boat spending; a name blaming the recipient's spouse is a different decision.

## Duplicates and spelling

Keep one spelling per joke. Group variants such as `KNOT FOR SAIL`, `KNOT 4 SAIL`
and `KNOT FOR SALE`, then choose the clearest form. Treat numbers used as words as
variants unless the number is part of the joke. Do not retain every variation of
“Knot,” “Reel” or “Sea” just to increase the count.

Use normal capitalization and restore obvious apostrophes: “Knot My Problem,”
“Seas the Day,” “Kids' Inheritance.” Preserve source spellings in the record.

## Review records

Write JSONL with one object per retained or borderline name. Omit rejects.

```json
{"key":"source key","name":"Display Name","decision":"keep","category":"dry-humour","joke":"Explain the joke in 15 words or fewer.","variants":[]}
```

Use `decision: "borderline"` and add `reason` when withholding a name. Put source
keys for other spellings in `variants`.

| Category | Use |
| --- | --- |
| `knot-puns` | Not/knot wordplay. |
| `reel-puns` | Real/reel and fishing-tackle wordplay. |
| `sea-puns` | See/sea, the letter C, and sea endings. |
| `dock-and-mooring` | Pier, moor, dock, berth, buoy and anchor puns. |
| `boat-parts` | Stern, hull, keel, bow, helm, sail, oar and wake puns. |
| `fishy` | Fish and sea-creature puns. |
| `money-pit` | Boat spending. |
| `day-job` | Work and time off. |
| `life-at-sea` | Weather, tides, waves and boating. |
| `dry-humour` | Deadpan or absurd phrases. |
| `household` | Family and household jokes. |
| `pop-culture` | References to films, songs and familiar sayings. |
