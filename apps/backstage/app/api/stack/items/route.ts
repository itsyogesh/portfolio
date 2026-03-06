import { database } from '@packages/db';
import { type NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../../_lib/auth';

// POST /api/stack/items — create item
export async function POST(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();

    if (!body.categoryId) {
      return NextResponse.json(
        { error: 'categoryId is required' },
        { status: 400 }
      );
    }

    const maxPosition = await database.stackItem.aggregate({
      where: { categoryId: body.categoryId },
      _max: { position: true },
    });

    const item = await database.stackItem.create({
      data: {
        name: body.name,
        description: body.description || null,
        logoUrl: body.logoUrl || null,
        url: body.url || null,
        level: body.level || null,
        keywords: body.keywords || [],
        position: (maxPosition._max.position ?? -1) + 1,
        categoryId: body.categoryId,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Failed to create item' },
      { status: 400 }
    );
  }
}
