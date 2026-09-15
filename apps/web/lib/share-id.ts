/** Short, URL-safe ids for caregiver share links. */

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';

export function newShareId(length = 10): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = '';
  for (const byte of bytes) out += ALPHABET[byte % ALPHABET.length];
  return out;
}

export function isShareId(value: string): boolean {
  return /^[A-Za-z0-9]{8,24}$/.test(value);
}

export const SHARE_TTL_MS = 14 * 24 * 60 * 60 * 1000;

export function shareBlobPath(id: string): string {
  return `shares/${id}.json`;
}
