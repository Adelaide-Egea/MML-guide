/** One password for the /admin dashboard.
 *
 *  Set ADMIN_PASSWORD in Vercel (TRIAL_SECRET still works as a fallback). The
 *  browser keeps an HttpOnly cookie holding an HMAC of the password, never the
 *  password itself. Changing the password logs every browser out.
 */

export const ADMIN_COOKIE = 'domela_admin';

export function adminPassword(env: Record<string, string | undefined> = process.env): string | null {
  const value = env.ADMIN_PASSWORD || env.TRIAL_SECRET;
  return value && value.length >= 8 ? value : null;
}

export async function adminToken(password: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode('domela-admin-v1'));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function isAdminCookie(value: string | undefined | null): Promise<boolean> {
  const password = adminPassword();
  if (!password || !value) return false;
  return safeEqual(value, await adminToken(password));
}

function cookieFrom(header: string | null, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return null;
}

/** Cookie from the dashboard login, or ?secret= for scripts. */
export async function isAdminRequest(req: Request): Promise<boolean> {
  const password = adminPassword();
  if (!password) return false;
  if (await isAdminCookie(cookieFrom(req.headers.get('cookie'), ADMIN_COOKIE))) return true;
  const secret = new URL(req.url).searchParams.get('secret');
  return secret !== null && safeEqual(secret, password);
}
