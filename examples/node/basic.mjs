// Run after `npm run build`:  node examples/node/basic.mjs
import {
  NameCapacityError,
  capacity,
  claimName,
  generateName,
  generateNames,
} from '../../dist/esm/index.js';

// One random name.
console.log(generateName().display);

// Reproducible: same seed + same DICTIONARY_VERSION -> same name.
const a = generateName({ seed: 'install-7f3c' });
console.log(a.display, a.username, a.dictionaryVersion);

// Batch, never repeating within the batch; with suffixes and a separator.
console.log(generateNames(5, { suffix: true, separator: '_' }).map((n) => n.username));

// Over-capacity is explicit.
try {
  generateNames(capacity({ source: 'curated' }) + 1, { source: 'curated' });
} catch (e) {
  if (e instanceof NameCapacityError) console.log(`capacity: ${e.available}`);
}

// Global uniqueness needs a registry. Here a Set stands in for a database
// table with a UNIQUE constraint on username.
const taken = new Set(['pierpressure', 'knotmyproblem']);
const mine = await claimName(async (name) => {
  if (taken.has(name.username)) return false; // collision: try another
  taken.add(name.username); // "INSERT ... " succeeded
  return true;
});
console.log('claimed', mine.display);
