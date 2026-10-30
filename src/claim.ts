import { nameStream, type GenerateOptions, type BoatName } from './generator.js';
import type { SequenceOptions } from './engine.js';

export interface RetryOptions {
  /** Total reservation attempts. Defaults to 20. */
  attempts?: number;
  /** Failed plain attempts before adding a suffix. Defaults to 5. */
  suffixAfter?: number;
}
export interface ClaimOptions extends GenerateOptions, RetryOptions {}

export class NameClaimError extends Error {
  readonly attempts: number;
  constructor(attempts: number) {
    super(`Could not claim a name after ${attempts} attempts.`);
    this.name = 'NameClaimError';
    this.attempts = attempts;
  }
}

/** Internal retry loop shared by boat and user reservations. */
export async function reserveName<Name, Options extends SequenceOptions>(
  tryClaim: (name: Name) => boolean | Promise<boolean>,
  options: Options & RetryOptions,
  stream: (options: Options) => Generator<Name, void, undefined>,
  suffixByDefault = false,
): Promise<Name> {
  const attempts = options.attempts ?? 20;
  const suffix = options.suffix ?? suffixByDefault;
  const suffixAfter = suffix ? 0 : options.suffixAfter ?? 5;
  if (!Number.isSafeInteger(attempts) || attempts < 1) throw new RangeError('attempts must be a positive safe integer.');
  if (!Number.isSafeInteger(suffixAfter) || suffixAfter < 0) throw new RangeError('suffixAfter must be a non-negative safe integer.');
  const exclude = options.exclude ? [...options.exclude] : undefined;
  const plain = suffix ? null : stream({ ...options, exclude, suffix: false });
  const suffixed = stream({
    ...options, exclude,
    seed: options.seed === undefined ? undefined : `${options.seed}#suffixed`,
    suffix: suffix || true,
  });
  let usePlain = plain !== null;
  let tried = 0;
  while (tried < attempts) {
    const candidates = usePlain && tried < suffixAfter ? plain! : suffixed;
    const next = candidates.next();
    if (next.done) {
      if (candidates === plain) { usePlain = false; continue; }
      break;
    }
    tried++;
    if (await tryClaim(next.value)) return next.value;
  }
  throw new NameClaimError(tried);
}

/** Reserve through an atomic database insert; false means the username is taken. */
export function claimName(
  tryClaim: (name: BoatName) => boolean | Promise<boolean>,
  options: ClaimOptions = {},
): Promise<BoatName> {
  return reserveName(tryClaim, options, nameStream);
}
