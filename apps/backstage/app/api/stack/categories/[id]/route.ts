import { database } from '@packages/db';
import { type NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../../../_lib/auth';

type RouteParams = { params: Promise<{ id: string }> };

// PATCH /api/stack/categories/[id] — update category
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();

    const category = await database.stackCategory.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.position !== undefined && { position: body.position }),
      },
    });

    return NextResponse.json(category);
  } catch {
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 400 }
    );
  }
}

// DELETE /api/stack/categories/[id] — delete category (cascades items)
export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams
) {
  const { id } = await params;
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    await database.stackCategory.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 400 }
    );
  }
}
