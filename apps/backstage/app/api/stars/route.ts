import { database } from '@packages/db';
import { type NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../_lib/auth';

// GET /api/stars — list starred repos (with optional listId filter)
export async function GET(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const listId = searchParams.get('listId');

  const where: Record<string, unknown> = {};

  if (listId === 'unsorted') {
    where.listId = null;
  } else if (listId) {
    where.listId = listId;
  }

  const repos = await database.starRepo.findMany({
    where,
    orderBy: { position: 'asc' },
    include: {
      list: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
    },
  });

  return NextResponse.json({ repos });
}
