import { getSessionCookie } from '@packages/auth/cookies';
import { type NextRequest, NextResponse } from 'next/server';

export const config = {
  matcher: [
    '/((?!sign-in|api|robots.txt|_next/static|_next/image|favicon.ico).*)',
  ],
};

export default async function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  return NextResponse.next();
}
