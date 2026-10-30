// Print a sample batch for editorial review:  npm run sample -- [count] [seed] [source]
import { generateNames } from '../dist/esm/index.js';

const [count = '100', seed, source = 'mixed'] = process.argv.slice(2);
const names = generateNames(Number(count), { seed, source });
const tally = {};
for (const n of names) {
  const k = n.template ?? 'curated';
  tally[k] = (tally[k] ?? 0) + 1;
}
names.forEach((n, i) => console.log(`${String(i + 1).padStart(3)}. ${n.display.padEnd(34)} ${n.template ?? 'curated'}`));
console.log('\n', tally);
