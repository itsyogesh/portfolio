import { database } from '@packages/db';
import { type NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../../_lib/auth';

type RouteParams = { params: Promise<{ id: string }> };

// PATCH /api/writing/[id] — update an external writing entry
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();

    const writing = await database.externalWriting.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.url !== undefined && { url: body.url }),
        ...(body.source !== undefined && { source: body.source || null }),
        ...(body.publishedAt !== undefined && {
          publishedAt: body.publishedAt ? new Date(body.publishedAt) : null,
        }),
        ...(body.summary !== undefined && { summary: body.summary || null }),
        ...(body.tags !== undefined && { tags: body.tags }),
        ...(body.imageUrl !== undefined && {
          imageUrl: body.imageUrl || null,
        }),
        ...(body.featured !== undefined && { featured: body.featured }),
        ...(body.position !== undefined && { position: body.position }),
      },
    });

    return NextResponse.json(writing);
  } catch {
    return NextResponse.json(
      { error: 'Failed to update external writing' },
      { status: 400 }
    );
  }
}

// DELETE /api/writing/[id] — delete an external writing entry
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    await database.externalWriting.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Failed to delete external writing' },
      { status: 400 }
    );
  }
}
