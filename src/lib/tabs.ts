/** Keep a tab id only when it is one of the sections on this screen. */
export function pickTab(
  value: string | string[] | undefined,
  allowed: readonly string[],
  fallback: string,
): string {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw && allowed.includes(raw)) return raw;
  return fallback;
}
