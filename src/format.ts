export type UsernameSeparator = '' | '_' | '-' | '.';

export interface UsernameOptions {
  /** Placed between words. Default '' ("pierpressure"). */
  separator?: UsernameSeparator;
  /** Appended after the words, without a separator ("pierpressure42"). */
  suffix?: number | null;
}

/**
 * Compact, ASCII, lowercase username for a display name.
 *
 *   toUsername("Kids' Inheritance")                 -> "kidsinheritance"
 *   toUsername("Pier Pressure", { separator: '_' }) -> "pier_pressure"
 *   toUsername("Pier Pressure", { suffix: 42 })     -> "pierpressure42"
 */
export function toUsername(display: string, options: UsernameOptions = {}): string {
  const sep = options.separator ?? '';
  const words = display
    .toLowerCase()
    .replace(/['’]/g, '')
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  const base = words.join(sep);
  return options.suffix == null ? base : `${base}${options.suffix}`;
}

/**
 * Key for comparing names: lowercase letters and digits only. Two names with
 * the same key would produce the same compact username, so the generator
 * never returns both in one batch.
 */
export function nameKey(name: string): string {
  return toUsername(name);
}
