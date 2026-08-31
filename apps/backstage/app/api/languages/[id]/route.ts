import { database } from '@packages/db';
import { type NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../../_lib/auth';

type RouteParams = { params: Promise<{ id: string }> };

// PATCH /api/languages/[id] — update language
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();

    const language = await database.language.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.fluency !== undefined && { fluency: body.fluency || null }),
        ...(body.position !== undefined && { position: body.position }),
      },
    });

    return NextResponse.json(language);
  } catch {
    return NextResponse.json(
      { error: 'Failed to update language' },
      { status: 400 }
    );
  }
}

// DELETE /api/languages/[id] — delete language
export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams
) {
  const { id } = await params;
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    await database.language.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Failed to delete language' },
      { status: 400 }
    );
  }
}
