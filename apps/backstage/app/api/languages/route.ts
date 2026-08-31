import { database } from '@packages/db';
import { type NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../_lib/auth';

// GET /api/languages — list all languages
export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const languages = await database.language.findMany({
    orderBy: { position: 'asc' },
  });

  return NextResponse.json(languages);
}

// POST /api/languages — create a language
export async function POST(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();

    const maxPosition = await database.language.aggregate({
      _max: { position: true },
    });

    const language = await database.language.create({
      data: {
        name: body.name,
        fluency: body.fluency || null,
        position: (maxPosition._max.position ?? -1) + 1,
      },
    });

    return NextResponse.json(language, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Failed to create language' },
      { status: 400 }
    );
  }
}
