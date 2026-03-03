import { database } from '@packages/db';
import { type NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../_lib/auth';

// GET /api/timeline — list timeline entries
export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const entries = await database.timelineEntry.findMany({
    orderBy: [{ year: 'desc' }, { position: 'asc' }],
  });

  return NextResponse.json(entries);
}

// POST /api/timeline — create timeline entry
export async function POST(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();

    const maxPosition = await database.timelineEntry.aggregate({
      where: { year: body.year },
      _max: { position: true },
    });

    const entry = await database.timelineEntry.create({
      data: {
        year: body.year,
        title: body.title,
        description: body.description || null,
        position: (maxPosition._max.position ?? -1) + 1,
      },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Failed to create timeline entry' },
      { status: 400 }
    );
  }
}
