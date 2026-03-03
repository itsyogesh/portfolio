import { database } from '@packages/db';
import { type NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../../../_lib/auth';

type RouteParams = { params: Promise<{ id: string }> };

// PATCH /api/stars/lists/[id] — update a star list
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();

    const list = await database.starList.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.description !== undefined && {
          description: body.description,
        }),
        ...(body.color !== undefined && { color: body.color }),
        ...(body.position !== undefined && { position: body.position }),
      },
    });

    return NextResponse.json(list);
  } catch {
    return NextResponse.json(
      { error: 'Failed to update list' },
      { status: 400 }
    );
  }
}

// DELETE /api/stars/lists/[id] — delete a star list (repos go to unsorted)
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    // Move all repos in this list to unsorted (listId = null)
    await database.starRepo.updateMany({
      where: { listId: id },
      data: { listId: null },
    });

    await database.starList.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Failed to delete list' },
      { status: 400 }
    );
  }
}
