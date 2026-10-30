export type UsernameSeparator = '' | '_' | '-' | '.';

export interface UsernameOptions {
  /** Placed between words and before a suffix. Default '_' ("pier_pressure"). */
  separator?: UsernameSeparator;
  /** Appended as the final token ("pier_pressure_42" with the default separator). */
  suffix?: number | null;
}

/**
 * ASCII, lowercase username for a display name. Defaults to underscore separators.
 *
 *   toUsername("Kids' Inheritance")                 -> "kids_inheritance"
 *   toUsername("Pier Pressure", { separator: '_' }) -> "pier_pressure"
 *   toUsername("Pier Pressure", { suffix: 42 })     -> "pier_pressure_42"
 */
export function toUsername(display: string, options: UsernameOptions = {}): string {
  const sep = options.separator ?? '_';
  if (!['', '_', '-', '.'].includes(sep)) throw new TypeError('Unknown username separator.');
  if (options.suffix != null && (!Number.isSafeInteger(options.suffix) || options.suffix < 0)) {
    throw new RangeError('suffix must be a non-negative safe integer.');
  }
  const words = display
    .toLowerCase()
    .replace(/['’]/g, '')
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  const base = words.join(sep);
  return options.suffix == null ? base : [base, String(options.suffix)].filter(Boolean).join(sep);
}

/**
 * Key for comparing names: lowercase letters and digits only. Two names with
 * the same key would produce the same compact username, so the generator
 * never returns both in one batch.
 */
export function nameKey(name: string): string {
  return toUsername(name, { separator: '' });
}
