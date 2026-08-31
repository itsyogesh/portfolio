import { database } from '@packages/db';
import { type NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../../../_lib/auth';

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/organizations/[id]/work — list work experiences for an org
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const { error } = await requireAdmin();
  if (error) return error;

  const workExperiences = await database.workExperience.findMany({
    where: { organizationId: id },
    orderBy: { position: 'asc' },
  });

  return NextResponse.json(workExperiences);
}

// POST /api/organizations/[id]/work — create work experience
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();

    const maxPosition = await database.workExperience.aggregate({
      where: { organizationId: id },
      _max: { position: true },
    });

    const workExperience = await database.workExperience.create({
      data: {
        title: body.title,
        description: body.description || null,
        startDate: new Date(body.startDate),
        endDate: body.endDate ? new Date(body.endDate) : null,
        type: body.type || 'fulltime',
        highlights: body.highlights || [],
        position: (maxPosition._max.position ?? -1) + 1,
        organizationId: id,
      },
    });

    return NextResponse.json(workExperience, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Failed to create work experience' },
      { status: 400 }
    );
  }
}
