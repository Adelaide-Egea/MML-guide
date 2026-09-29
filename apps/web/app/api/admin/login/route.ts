import { NextResponse } from 'next/server';
import { ADMIN_COOKIE, adminPassword, adminToken, safeEqual } from '../../../../lib/admin-auth.ts';

export const runtime = 'nodejs';

const THIRTY_DAYS = 60 * 60 * 24 * 30;

export async function POST(req: Request) {
  const password = adminPassword();
  const form = await req.formData().catch(() => null);
  const given = String(form?.get('password') ?? '');
  const back = new URL('/admin', req.url);

  if (!password) {
    back.searchParams.set('error', 'unset');
    return NextResponse.redirect(back, 303);
  }
  if (!safeEqual(given, password)) {
    // Slow down guessing.
    await new Promise((resolve) => setTimeout(resolve, 1200));
    back.searchParams.set('error', 'wrong');
    return NextResponse.redirect(back, 303);
  }

  const response = NextResponse.redirect(back, 303);
  response.cookies.set(ADMIN_COOKIE, await adminToken(password), {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: THIRTY_DAYS,
  });
  return response;
}
