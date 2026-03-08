import { database } from '@packages/db';
import { type NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../_lib/auth';

// GET /api/education — list all education entries
export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const education = await database.education.findMany({
    orderBy: { position: 'asc' },
  });

  return NextResponse.json(education);
}

// POST /api/education — create education entry
export async function POST(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();

    const maxPosition = await database.education.aggregate({
      _max: { position: true },
    });

    const education = await database.education.create({
      data: {
        institution: body.institution,
        degree: body.degree || null,
        field: body.field || null,
        description: body.description || null,
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
        logoUrl: body.logoUrl || null,
        url: body.url || null,
        gpa: body.gpa || null,
        courses: body.courses || [],
        position: (maxPosition._max.position ?? -1) + 1,
      },
    });

    return NextResponse.json(education, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Failed to create education entry' },
      { status: 400 }
    );
  }
}
