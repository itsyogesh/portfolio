import { database } from '@packages/db';
import { type NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../../_lib/auth';

type RouteParams = { params: Promise<{ id: string }> };

// PATCH /api/organizations/[id] — update organization
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();

    const organization = await database.organization.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.description !== undefined && {
          description: body.description || null,
        }),
        ...(body.logoUrl !== undefined && { logoUrl: body.logoUrl || null }),
        ...(body.website !== undefined && { website: body.website || null }),
        ...(body.location !== undefined && {
          location: body.location || null,
        }),
        ...(body.type !== undefined && { type: body.type }),
      },
    });

    return NextResponse.json(organization);
  } catch {
    return NextResponse.json(
      { error: 'Failed to update organization' },
      { status: 400 }
    );
  }
}

// DELETE /api/organizations/[id] — delete organization (cascades work experiences)
export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams
) {
  const { id } = await params;
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    await database.organization.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Failed to delete organization' },
      { status: 400 }
    );
  }
}
