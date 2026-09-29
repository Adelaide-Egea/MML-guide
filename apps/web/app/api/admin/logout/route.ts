import { NextResponse } from 'next/server';
import { ADMIN_COOKIE } from '../../../../lib/admin-auth.ts';

export async function POST(req: Request) {
  const response = NextResponse.redirect(new URL('/admin', req.url), 303);
  response.cookies.set(ADMIN_COOKIE, '', { path: '/', maxAge: 0 });
  return response;
}
