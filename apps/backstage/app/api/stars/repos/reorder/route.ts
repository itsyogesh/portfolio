import { database } from '@packages/db';
import { type NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../../../_lib/auth';

type ReorderItem = {
  id: string;
  position: number;
  listId: string | null;
};

// PATCH /api/stars/repos/reorder — bulk update positions and list assignments
export async function PATCH(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body: { items: ReorderItem[] } = await request.json();

    if (!Array.isArray(body.items)) {
      return NextResponse.json(
        { error: 'items must be an array' },
        { status: 400 }
      );
    }

    // Use a transaction to update all positions atomically
    await database.$transaction(
      body.items.map((item) =>
        database.starRepo.update({
          where: { id: item.id },
          data: {
            position: item.position,
            listId: item.listId,
          },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Failed to reorder repos' },
      { status: 400 }
    );
  }
}
