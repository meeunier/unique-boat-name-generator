import { CURATED } from './data/phrases.js';
import { TEMPLATES, type Template } from './data/templates.js';
import { createGenerator, type GeneratedName, type NamePool, type SequenceOptions } from './engine.js';
import { DICTIONARY_VERSION } from './version.js';

export { NameCapacityError, type SuffixRange } from './engine.js';
export type NameSource = 'mixed' | 'curated' | 'template';

export interface GenerateOptions extends SequenceOptions {
  /** Defaults to mixed. */
  source?: NameSource;
  /** Initial curated selection probability in mixed mode. Defaults to 0.5. */
  curatedShare?: number;
}

export interface BatchOptions extends GenerateOptions {
  /** Return available names instead of throwing when there are too few. */
  partial?: boolean;
}

export type BoatName = GeneratedName<'curated' | 'template'>;
type Pool = NamePool<BoatName['source']>;

function templatePool(template: Template, weight: number): Pool {
  return {
    size: template.slots.reduce((n, slot) => n * slot.length, 1),
    weight,
    source: 'template',
    template: template.id,
    get(index) {
      const words: string[] = new Array(template.slots.length);
      let rest = index;
      for (let i = template.slots.length - 1; i >= 0; i--) {
        const slot = template.slots[i]!;
        words[i] = slot[rest % slot.length]!;
        rest = Math.floor(rest / slot.length);
      }
      return template.pattern.replace(/\{(\d+)\}/g, (_, digit: string) => words[Number(digit)]!);
    },
  };
}

function buildPools(options: GenerateOptions): Pool[] {
  const source = options.source ?? 'mixed';
  if (!['mixed', 'curated', 'template'].includes(source)) throw new TypeError(`Unknown source "${String(source)}".`);
  const share = options.curatedShare ?? 0.5;
  if (typeof share !== 'number' || !(share >= 0 && share <= 1)) throw new RangeError('curatedShare must be between 0 and 1.');
  const curatedWeight = source === 'curated' ? 1 : source === 'template' ? 0 : share;
  const templateShare = source === 'curated' ? 0 : source === 'template' ? 1 : 1 - share;
  const pools: Pool[] = [];
  if (curatedWeight > 0) pools.push({
    size: CURATED.length, weight: curatedWeight, source: 'curated', template: null,
    get: (index) => CURATED[index]!,
  });
  if (templateShare > 0) {
    const totalWeight = TEMPLATES.reduce((n, template) => n + template.weight, 0);
    for (const template of TEMPLATES) pools.push(templatePool(template, templateShare * template.weight / totalWeight));
  }
  return pools;
}

const generator = createGenerator({ pools: buildPools, dictionaryVersion: DICTIONARY_VERSION });
export const { generateName, generateNames, nameStream, capacity } = generator;
