import { database } from '@packages/db';
import { type NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../../_lib/auth';

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/bookmarks/[id] — full bookmark details (admin)
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const { error } = await requireAdmin();
  if (error) return error;

  const bookmark = await database.bookmark.findUnique({ where: { id } });

  if (!bookmark) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(bookmark);
}

// PATCH /api/bookmarks/[id] — update bookmark (admin only)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();

    const bookmark = await database.bookmark.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.url !== undefined && { url: body.url }),
        ...(body.category !== undefined && { category: body.category }),
        ...(body.tags !== undefined && { tags: body.tags }),
        ...(body.isPublic !== undefined && { isPublic: body.isPublic }),
        ...(body.isFeatured !== undefined && { isFeatured: body.isFeatured }),
        ...(body.summary !== undefined && { summary: body.summary }),
      },
    });

    return NextResponse.json(bookmark);
  } catch {
    return NextResponse.json(
      { error: 'Failed to update bookmark' },
      { status: 400 }
    );
  }
}

// DELETE /api/bookmarks/[id] — delete bookmark (admin only)
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    await database.bookmark.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Failed to delete bookmark' },
      { status: 400 }
    );
  }
}
