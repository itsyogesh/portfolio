import { database } from '@packages/db';
import { type NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../../_lib/auth';

type RouteParams = { params: Promise<{ id: string }> };

// PATCH /api/education/[id] — update education entry
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();

    const education = await database.education.update({
      where: { id },
      data: {
        ...(body.institution !== undefined && {
          institution: body.institution,
        }),
        ...(body.degree !== undefined && { degree: body.degree || null }),
        ...(body.field !== undefined && { field: body.field || null }),
        ...(body.description !== undefined && {
          description: body.description || null,
        }),
        ...(body.startDate !== undefined && {
          startDate: body.startDate ? new Date(body.startDate) : null,
        }),
        ...(body.endDate !== undefined && {
          endDate: body.endDate ? new Date(body.endDate) : null,
        }),
        ...(body.logoUrl !== undefined && { logoUrl: body.logoUrl || null }),
        ...(body.url !== undefined && { url: body.url || null }),
        ...(body.gpa !== undefined && { gpa: body.gpa || null }),
        ...(body.courses !== undefined && { courses: body.courses }),
        ...(body.position !== undefined && { position: body.position }),
      },
    });

    return NextResponse.json(education);
  } catch {
    return NextResponse.json(
      { error: 'Failed to update education entry' },
      { status: 400 }
    );
  }
}

// DELETE /api/education/[id] — delete education entry
export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams
) {
  const { id } = await params;
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    await database.education.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Failed to delete education entry' },
      { status: 400 }
    );
  }
}
