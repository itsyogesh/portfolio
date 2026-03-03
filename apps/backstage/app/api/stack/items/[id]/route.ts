import { database } from '@packages/db';
import { type NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../../../_lib/auth';

type RouteParams = { params: Promise<{ id: string }> };

// PATCH /api/stack/items/[id] — update item
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();

    const item = await database.stackItem.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.description !== undefined && {
          description: body.description || null,
        }),
        ...(body.logoUrl !== undefined && {
          logoUrl: body.logoUrl || null,
        }),
        ...(body.url !== undefined && { url: body.url || null }),
        ...(body.position !== undefined && { position: body.position }),
        ...(body.categoryId !== undefined && {
          categoryId: body.categoryId,
        }),
      },
    });

    return NextResponse.json(item);
  } catch {
    return NextResponse.json(
      { error: 'Failed to update item' },
      { status: 400 }
    );
  }
}

// DELETE /api/stack/items/[id] — delete item
export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams
) {
  const { id } = await params;
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    await database.stackItem.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Failed to delete item' },
      { status: 400 }
    );
  }
}
