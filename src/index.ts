export {
  generateName,
  generateName as generateBoatName,
  generateNames,
  generateNames as generateBoatNames,
  nameStream,
  nameStream as boatNameStream,
  capacity,
  capacity as boatNameCapacity,
  NameCapacityError,
  type GenerateOptions,
  type BatchOptions,
  type BoatName,
  type NameSource,
  type SuffixRange,
} from './generator.js';
export { claimName, claimName as claimBoatName, NameClaimError, type ClaimOptions } from './claim.js';
export {
  generateUsername, generateUsernames, usernameStream, usernameCapacity, claimUsername,
  type Username, type GenerateUsernameOptions, type UsernameBatchOptions, type UsernameClaimOptions,
} from './usernames.js';
export { USERNAME_BASES, USERNAME_DICTIONARY_VERSION } from './data/characters.js';
export { toUsername, type UsernameOptions, type UsernameSeparator } from './format.js';
export { seededRandom, type RandomSource } from './rng.js';
export { DICTIONARY_VERSION } from './version.js';
export { CURATED as CURATED_NAMES } from './data/phrases.js';
export { TEMPLATES, type Template } from './data/templates.js';
