import { database } from '@packages/db';
import { type NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../_lib/auth';

// GET /api/accolades — list all accolades
export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const accolades = await database.accolade.findMany({
    orderBy: { position: 'asc' },
  });

  return NextResponse.json(accolades);
}

// POST /api/accolades — create accolade
export async function POST(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();

    const maxPosition = await database.accolade.aggregate({
      _max: { position: true },
    });

    const accolade = await database.accolade.create({
      data: {
        title: body.title,
        issuer: body.issuer || null,
        type: body.type || 'award',
        description: body.description || null,
        url: body.url || null,
        date: body.date ? new Date(body.date) : null,
        imageUrl: body.imageUrl || null,
        position: (maxPosition._max.position ?? -1) + 1,
      },
    });

    return NextResponse.json(accolade, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Failed to create accolade' },
      { status: 400 }
    );
  }
}
