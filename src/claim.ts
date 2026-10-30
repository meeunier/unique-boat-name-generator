import { nameStream, type GenerateOptions, type NautiName } from './generator.js';

export interface ClaimOptions extends GenerateOptions {
  /** Total attempts before giving up. Default 20. */
  attempts?: number;
  /**
   * After this many failed attempts without a suffix, switch to suffixed
   * names (using `suffix` if given, else 10–99). Default 5. Ignored when
   * `suffix` is already enabled.
   */
  suffixAfter?: number;
}

export class NameClaimError extends Error {
  readonly attempts: number;
  constructor(attempts: number) {
    super(`Could not claim a name after ${attempts} attempts.`);
    this.name = 'NameClaimError';
    this.attempts = attempts;
  }
}

/**
 * Find a name your backend accepts. This package cannot know which names are
 * taken; global uniqueness needs your database. `tryClaim` should atomically
 * reserve the name (e.g. INSERT with a UNIQUE constraint on the username) and
 * return true on success, false on a collision.
 *
 * Candidates never repeat within one call. Errors thrown by `tryClaim`
 * (network, etc.) propagate unchanged.
 */
export async function claimName(
  tryClaim: (name: NautiName) => boolean | Promise<boolean>,
  options: ClaimOptions = {},
): Promise<NautiName> {
  const attempts = options.attempts ?? 20;
  const suffixAfter = options.suffix ? 0 : options.suffixAfter ?? 5;
  if (!Number.isInteger(attempts) || attempts < 1) throw new RangeError('attempts must be a positive integer.');

  const plain = options.suffix ? null : nameStream({ ...options, suffix: false });
  const suffixed = nameStream({
    ...options,
    // Different seed so the suffixed phase doesn't replay the same phrases.
    seed: options.seed === undefined ? undefined : `${options.seed}#suffixed`,
    suffix: options.suffix || true,
  });

  let usePlain = plain !== null;
  let tried = 0;
  while (tried < attempts) {
    const stream = usePlain && tried < suffixAfter ? plain! : suffixed;
    const next = stream.next();
    if (next.done) {
      if (stream === plain) {
        usePlain = false; // plain names exhausted (e.g. by `exclude`)
        continue;
      }
      break;
    }
    tried++;
    if (await tryClaim(next.value)) return next.value;
  }
  throw new NameClaimError(attempts);
}
