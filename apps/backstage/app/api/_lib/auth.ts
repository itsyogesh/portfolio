import { auth } from '@packages/auth/server';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { NextResponse } from 'next/server';

export async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
}

export async function requireAdmin() {
  const session = await getSession();
  if (!session?.user) {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      session: null,
    };
  }
  const ownerEmail = process.env.OWNER_EMAIL;
  if (!ownerEmail) {
    return {
      error: NextResponse.json(
        { error: 'OWNER_EMAIL not configured' },
        { status: 500 }
      ),
      session: null,
    };
  }
  if (session.user.email !== ownerEmail) {
    return {
      error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
      session: null,
    };
  }
  return { error: null, session };
}

export async function requireAdminPage() {
  const ownerEmail = process.env.OWNER_EMAIL;
  if (!ownerEmail) {
    throw new Error('OWNER_EMAIL environment variable is not configured');
  }
  const session = await getSession();
  if (!session?.user || session.user.email !== ownerEmail) {
    redirect('/sign-in');
  }
  return session;
}
