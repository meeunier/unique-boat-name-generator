import { USERNAME_BASES, USERNAME_DICTIONARY_VERSION } from './data/characters.js';
import { createGenerator, type SequenceOptions } from './engine.js';
import { NameClaimError } from './claim.js';

/** Usernames always use underscores and a random number from 1000–9999. */
export interface GenerateUsernameOptions extends Pick<SequenceOptions, 'seed' | 'random' | 'exclude'> {}
export interface UsernameBatchOptions extends GenerateUsernameOptions { partial?: boolean; }
export interface UsernameClaimOptions extends GenerateUsernameOptions { attempts?: number; }
export type Username = string;

const generator = createGenerator<'character', SequenceOptions>({
  dictionaryVersion: USERNAME_DICTIONARY_VERSION,
  pools: () => [{
    size: USERNAME_BASES.length, weight: 1, source: 'character', template: null,
    get: (index) => USERNAME_BASES[index]!,
  }],
});

function resolve(options: GenerateUsernameOptions): SequenceOptions {
  return {
    seed: options.seed, random: options.random, exclude: options.exclude,
    separator: '_', suffix: { min: 1000, max: 9999 },
  };
}

export function generateUsername(options: GenerateUsernameOptions = {}): Username {
  return generator.generateName(resolve(options)).username;
}

export function generateUsernames(count: number, options: UsernameBatchOptions = {}): Username[] {
  return generator.generateNames(count, { ...resolve(options), partial: options.partial }).map((name) => name.username);
}

export function* usernameStream(options: GenerateUsernameOptions = {}): Generator<Username, void, undefined> {
  for (const name of generator.nameStream(resolve(options))) yield name.username;
}

export function usernameCapacity(): number {
  return USERNAME_BASES.length * 9000;
}

/** Reserve a username with an atomic database insert; false means it is taken. */
export async function claimUsername(
  tryClaim: (username: Username) => boolean | Promise<boolean>,
  options: UsernameClaimOptions = {},
): Promise<Username> {
  const attempts = options.attempts ?? 20;
  if (!Number.isSafeInteger(attempts) || attempts < 1) throw new RangeError('attempts must be a positive safe integer.');
  let tried = 0;
  for (const username of usernameStream(options)) {
    tried++;
    if (await tryClaim(username)) return username;
    if (tried === attempts) break;
  }
  throw new NameClaimError(tried);
}
