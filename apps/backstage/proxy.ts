import { type NextRequest, NextResponse } from 'next/server';

export const config = {
  matcher: ['/((?!sign-in|api|_next/static|_next/image|favicon.ico).*)'],
};

export default async function proxy(request: NextRequest) {
  const sessionCookie = request.cookies.get('better-auth.session_token');

  if (!sessionCookie?.value) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  return NextResponse.next();
}
