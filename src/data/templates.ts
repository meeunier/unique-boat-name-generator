/**
 * Name templates. Each template has its OWN slot lists, chosen so that every
 * combination in that template reads as a joke. We deliberately avoid a global
 * "adjective x noun" cross product: most random pairs are not funny.
 *
 * Editorial notes on why each template exists live in
 * research/editorial/templates.md (not shipped).
 *
 * Changing ANY list here changes seeded output: bump DICTIONARY_VERSION.
 */
export interface Template {
  /** Stable identifier, also used in name ids ("t:critter:..."). */
  readonly id: string;
  /** Display pattern; {0}, {1} are replaced by slot words. */
  readonly pattern: string;
  readonly slots: readonly (readonly string[])[];
  /** Relative share of template draws in "mixed" and "template" modes. */
  readonly weight: number;
}

/** "Tax-Deductible Walrus": a deadpan personality trait on a sea creature. */
const critterTraits = [
  'Sarcastic', 'Unbothered', 'Overcaffeinated', 'Retired', 'Suspicious',
  'Philosophical', 'Dramatic', 'Fashionably Late', 'Slightly Damp',
  'Overdressed', 'Smug', 'Reluctant', 'Off-Duty', 'Part-Time', 'Self-Appointed',
  'Semi-Professional', 'Freelance', 'Unlicensed', 'Tax-Deductible', 'Seasick',
  'Landlocked', 'Moderately Famous', 'Overqualified',
  'Easily Distracted', 'Undercover', 'Unimpressed',
  'Recently Promoted', 'Mildly Concerned', 'Award-Winning', 'Unsupervised',
  'Self-Taught', 'Chronically Early',
] as const;

const critters = [
  'Barnacle', 'Seagull', 'Pelican', 'Manatee', 'Lobster', 'Clam', 'Otter',
  'Puffin', 'Walrus', 'Narwhal', 'Hermit Crab', 'Sea Cucumber', 'Jellyfish',
  'Anchovy', 'Cormorant', 'Sea Lion', 'Herring', 'Mackerel', 'Halibut',
  'Octopus', 'Squid', 'Starfish', 'Seahorse', 'Flounder', 'Sardine', 'Oyster',
  'Pufferfish', 'Beluga',
] as const;

/** "Navigator Wrong Turn": an official-sounding rank with a mundane epithet. */
const ranks = [
  'Captain', 'Admiral', 'Commodore', 'Skipper', 'First Mate', 'Bosun',
  'Deckhand', 'Navigator',
] as const;

const epithets = [
  'Hindsight', 'Snacks', 'Shrug', 'Overthink', 'Detour', 'Leftovers',
  'Sunscreen', 'Naptime', 'Dad Joke', 'Small Talk', 'Guesswork', 'Sidequest',
  'Plan B', 'Maybe', 'Eventually', 'Spreadsheet', 'Shortcut', 'Rain Check', 'Pocket Lint', 'Coffee Break', 'Wrong Turn', 'Low Battery',
  'Fine Print', 'Group Chat',
  'Close Enough', 'Good Intentions', 'Hold Music', 'Five More Minutes',
] as const;

/** "Technically Afloat": a status update with a hedging adverb. */
const hedges = [ 'Mostly', 'Temporarily', 'Permanently', 'Allegedly',
  'Technically', 'Professionally', 'Reportedly',
  'Officially',
] as const;

const boatStates = [
  'Adrift', 'Aground', 'Becalmed', 'At Anchor', 'Below Deck', 'Off Course',
  'Docked', 'Afloat', 'Seasick',
  'Landlocked', 'Waterlogged', 'Moored', 'Shipshape', 'Underway',
  'Bailing',
] as const;

/** "Dignity Overboard": something lost over the side. */
const overboardThings = [
  'Budget', 'Savings', 'Dignity', 'Sunglasses', 'Car Keys', 'Phone', 'Snacks',
  'Schedule', 'Common Sense', 'Patience', 'Sandwich', 'Paperwork', 'Diet',
  'Excuses', 'Homework', 'Flip-Flop', 'Spreadsheet', 'Inbox', 'Agenda',
  'Caution', 'Resolutions', 'Itinerary',
] as const;

/** "Knot Impressed": knot = not. Avoids complements already curated (Knot Today...). */
const knotStates = [
  'Bothered', 'Impressed', 'Convinced', 'Listening', 'Amused',
  'Fussed', 'Qualified', 'Serious', 'Rushing', 'Telling', 'Complaining',
  'Panicking', 'Judging', 'Kidding', 'Asking', 'Interested', 'Overthinking',
  'Sorry', 'Ready', 'Lost Yet',
] as const;

/** "Reel Humble": reel = really. */
const reelTraits = [
  'Talk', 'Busy', 'Patient', 'Quiet', 'Optimistic', 'Dedicated', 'Casual',
  'Smooth', 'Mature', 'Professional', 'Relaxed', 'Sneaky', 'Humble', 'Chill',
  'Committed', 'Fancy', 'Polite', 'Sincere', 'Organized', 'Proud',
] as const;

/** "Stern But Fair": stern (the back of the boat) but approachable. */
const sternTraits = [
  'Fair', 'Friendly', 'Kind', 'Cheerful', 'Lovable', 'Hungry', 'Sleepy',
  'Reasonable', 'Sunburnt', 'Fun', 'Flexible', 'Polite', 'Ticklish',
  'Approachable',
] as const;

/** "Moor Naps": moor = more. */
const moorThings = [
  'Snacks', 'Coffee', 'Naps', 'Sunscreen', 'Sunshine', 'Time Off',
  'Vacation', 'Leg Room', 'Daylight', 'Patience',
] as const;

/** "Pier Review": pier = peer. */
const pierThings = [ 'Support', 'Mentor', 'Approved', 'Tutor', 'Counsellor', 'Network',
] as const;

/** "Sea You Next Tide": sea = see. */
const seaYouWhen = [
  'Soon', 'Monday', 'Next Tide', 'At Sunset', 'Around', 'In A While',
  'Next Summer', 'Tomorrow',
] as const;

export const TEMPLATES: readonly Template[] = [
  { id: 'critter', pattern: '{0} {1}', slots: [critterTraits, critters], weight: 34 },
  { id: 'status', pattern: '{0} {1}', slots: [hedges, boatStates], weight: 20 },
  { id: 'rank', pattern: '{0} {1}', slots: [ranks, epithets], weight: 16 },
  { id: 'overboard', pattern: '{0} Overboard', slots: [overboardThings], weight: 7 },
  { id: 'knot', pattern: 'Knot {0}', slots: [knotStates], weight: 7 },
  { id: 'reel', pattern: 'Reel {0}', slots: [reelTraits], weight: 6 },
  { id: 'stern', pattern: 'Stern But {0}', slots: [sternTraits], weight: 4 },
  { id: 'moor', pattern: 'Moor {0}', slots: [moorThings], weight: 3 },
  { id: 'pier', pattern: 'Pier {0}', slots: [pierThings], weight: 1.5 },
  { id: 'sea', pattern: 'Sea You {0}', slots: [seaYouWhen], weight: 1.5 },
];
