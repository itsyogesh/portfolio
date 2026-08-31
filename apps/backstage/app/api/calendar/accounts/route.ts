import { database } from '@packages/db';
import { buildOAuthUrl } from '@packages/calendar';
import { randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../../_lib/auth';

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const accounts = await database.googleAccount.findMany({
    include: { _count: { select: { calendars: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(accounts);
}

export async function POST() {
  const { error } = await requireAdmin();
  if (error) return error;

  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  if (!redirectUri) {
    return NextResponse.json(
      { error: 'GOOGLE_REDIRECT_URI not configured' },
      { status: 500 }
    );
  }

  const state = randomBytes(32).toString('hex');
  const cookieStore = await cookies();
  cookieStore.set('google_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600, // 10 minutes
    path: '/',
  });

  const url = buildOAuthUrl(redirectUri, state);
  return NextResponse.json({ url });
}
