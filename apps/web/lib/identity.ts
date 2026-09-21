/** Resolve subject identity to a Linen tint + matching ink. */
export function identityPair(colourToken: string): { tint: string; ink: string } {
  const legacy: Record<string, string> = {
    '--id-petrol': '--id-dusk',
    '--id-indigo': '--id-dusk',
    '--id-olive': '--id-sage',
    '--id-forest': '--id-sage',
    'id-teal': '--id-dusk',
    'id-moss': '--id-sage',
    'id-clay': '--id-clay',
    'id-indigo': '--id-dusk',
  };
  const raw = legacy[colourToken] ?? colourToken;
  const tint = raw.endsWith('-ink') ? raw.replace(/-ink$/, '') : raw;
  const normalized = tint.startsWith('--') ? tint : `--${tint}`;
  return { tint: normalized, ink: `${normalized}-ink` };
}
