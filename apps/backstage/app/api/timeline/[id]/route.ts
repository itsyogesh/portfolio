import { database } from '@packages/db';
import { type NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../../_lib/auth';

type RouteParams = { params: Promise<{ id: string }> };

// PATCH /api/timeline/[id] — update timeline entry
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();

    const entry = await database.timelineEntry.update({
      where: { id },
      data: {
        ...(body.year !== undefined && { year: body.year }),
        ...(body.title !== undefined && { title: body.title }),
        ...(body.description !== undefined && {
          description: body.description || null,
        }),
        ...(body.position !== undefined && { position: body.position }),
      },
    });

    return NextResponse.json(entry);
  } catch {
    return NextResponse.json(
      { error: 'Failed to update timeline entry' },
      { status: 400 }
    );
  }
}

// DELETE /api/timeline/[id] — delete timeline entry
export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams
) {
  const { id } = await params;
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    await database.timelineEntry.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Failed to delete timeline entry' },
      { status: 400 }
    );
  }
}
