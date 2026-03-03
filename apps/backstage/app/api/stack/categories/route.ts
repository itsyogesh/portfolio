import { database } from '@packages/db';
import { type NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../../_lib/auth';

// GET /api/stack/categories — list categories with items
export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const categories = await database.stackCategory.findMany({
    orderBy: { position: 'asc' },
    include: {
      items: {
        orderBy: { position: 'asc' },
      },
    },
  });

  return NextResponse.json(categories);
}

// POST /api/stack/categories — create category
export async function POST(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();

    const maxPosition = await database.stackCategory.aggregate({
      _max: { position: true },
    });

    const category = await database.stackCategory.create({
      data: {
        name: body.name,
        position: (maxPosition._max.position ?? -1) + 1,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 400 }
    );
  }
}
