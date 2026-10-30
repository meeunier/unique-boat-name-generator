export {
  generateName,
  generateNames,
  nameStream,
  capacity,
  NameCapacityError,
  type GenerateOptions,
  type BatchOptions,
  type NautiName,
  type NameSource,
  type SuffixRange,
} from './generator.js';
export { claimName, NameClaimError, type ClaimOptions } from './claim.js';
export { toUsername, type UsernameOptions, type UsernameSeparator } from './format.js';
export { seededRandom, type RandomSource } from './rng.js';
export { DICTIONARY_VERSION } from './version.js';
export { CURATED as CURATED_NAMES } from './data/phrases.js';
export { TEMPLATES, type Template } from './data/templates.js';
