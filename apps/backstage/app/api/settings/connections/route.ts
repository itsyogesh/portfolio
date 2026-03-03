import { database } from '@packages/db';
import { NextResponse } from 'next/server';
import { getSession, requireAdmin } from '../../_lib/auth';

// GET /api/settings/connections — list connected accounts for the current user
export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const accounts = await database.account.findMany({
    where: { userId: session.user.id },
    select: {
      id: true,
      providerId: true,
      accountId: true,
      scope: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(accounts);
}
