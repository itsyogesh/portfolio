import { database } from '@packages/db';
import { type NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../../../_lib/auth';

type RouteParams = { params: Promise<{ id: string }> };

// PATCH /api/profile/socials/[id] — update a social link
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();

    const social = await database.socialLink.update({
      where: { id },
      data: {
        ...(body.platform !== undefined && { platform: body.platform }),
        ...(body.url !== undefined && { url: body.url }),
        ...(body.label !== undefined && { label: body.label || null }),
        ...(body.position !== undefined && { position: body.position }),
      },
    });

    return NextResponse.json(social);
  } catch {
    return NextResponse.json(
      { error: 'Failed to update social link' },
      { status: 400 }
    );
  }
}

// DELETE /api/profile/socials/[id] — delete a social link
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    await database.socialLink.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Failed to delete social link' },
      { status: 400 }
    );
  }
}
