import { database } from '@packages/db';
import { type NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../../_lib/auth';

// GET /api/stars/lists — list all star lists
export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const lists = await database.starList.findMany({
    orderBy: { position: 'asc' },
    include: {
      _count: {
        select: { repos: true },
      },
    },
  });

  return NextResponse.json({ lists });
}

// POST /api/stars/lists — create a new star list
export async function POST(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();

    // Get the max position to put the new list at the end
    const maxPosition = await database.starList.aggregate({
      _max: { position: true },
    });
    const nextPosition = (maxPosition._max.position ?? -1) + 1;

    const list = await database.starList.create({
      data: {
        name: body.name,
        description: body.description || null,
        color: body.color || null,
        position: nextPosition,
      },
    });

    return NextResponse.json(list, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Failed to create list' },
      { status: 400 }
    );
  }
}
