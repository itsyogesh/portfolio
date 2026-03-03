import { database } from '@packages/db';
import { type NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../../_lib/auth';

type RouteParams = { params: Promise<{ id: string }> };

// PATCH /api/accolades/[id] — update accolade
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();

    const accolade = await database.accolade.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.issuer !== undefined && { issuer: body.issuer || null }),
        ...(body.type !== undefined && { type: body.type }),
        ...(body.description !== undefined && {
          description: body.description || null,
        }),
        ...(body.url !== undefined && { url: body.url || null }),
        ...(body.date !== undefined && {
          date: body.date ? new Date(body.date) : null,
        }),
        ...(body.imageUrl !== undefined && {
          imageUrl: body.imageUrl || null,
        }),
        ...(body.position !== undefined && { position: body.position }),
      },
    });

    return NextResponse.json(accolade);
  } catch {
    return NextResponse.json(
      { error: 'Failed to update accolade' },
      { status: 400 }
    );
  }
}

// DELETE /api/accolades/[id] — delete accolade
export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams
) {
  const { id } = await params;
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    await database.accolade.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Failed to delete accolade' },
      { status: 400 }
    );
  }
}
