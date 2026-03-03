import { database } from '@packages/db';
import { type NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../../../_lib/auth';

type RouteParams = { params: Promise<{ id: string }> };

// PATCH /api/stars/repos/[id] — update a star repo (e.g., move to a different list)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();

    const repo = await database.starRepo.update({
      where: { id },
      data: {
        ...(body.listId !== undefined && {
          listId: body.listId,
        }),
        ...(body.position !== undefined && { position: body.position }),
      },
    });

    return NextResponse.json(repo);
  } catch {
    return NextResponse.json(
      { error: 'Failed to update repo' },
      { status: 400 }
    );
  }
}
