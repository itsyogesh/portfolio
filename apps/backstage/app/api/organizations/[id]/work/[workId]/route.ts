import { database } from '@packages/db';
import { type NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../../../../_lib/auth';

type RouteParams = { params: Promise<{ id: string; workId: string }> };

// PATCH /api/organizations/[id]/work/[workId] — update work experience
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { workId } = await params;
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();

    const workExperience = await database.workExperience.update({
      where: { id: workId },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.description !== undefined && {
          description: body.description || null,
        }),
        ...(body.startDate !== undefined && {
          startDate: new Date(body.startDate),
        }),
        ...(body.endDate !== undefined && {
          endDate: body.endDate ? new Date(body.endDate) : null,
        }),
        ...(body.type !== undefined && { type: body.type }),
        ...(body.position !== undefined && { position: body.position }),
      },
    });

    return NextResponse.json(workExperience);
  } catch {
    return NextResponse.json(
      { error: 'Failed to update work experience' },
      { status: 400 }
    );
  }
}

// DELETE /api/organizations/[id]/work/[workId] — delete work experience
export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams
) {
  const { workId } = await params;
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    await database.workExperience.delete({ where: { id: workId } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Failed to delete work experience' },
      { status: 400 }
    );
  }
}
