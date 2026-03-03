import { database } from '@packages/db';
import { type NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../_lib/auth';

// GET /api/writing — list all external writing ordered by position
export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const writings = await database.externalWriting.findMany({
    orderBy: { position: 'asc' },
  });

  return NextResponse.json(writings);
}

// POST /api/writing — create an external writing entry
export async function POST(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();

    const writing = await database.externalWriting.create({
      data: {
        title: body.title,
        url: body.url,
        source: body.source || null,
        publishedAt: body.publishedAt ? new Date(body.publishedAt) : null,
        summary: body.summary || null,
        tags: body.tags || [],
        imageUrl: body.imageUrl || null,
        featured: body.featured ?? false,
        position: body.position ?? 0,
      },
    });

    return NextResponse.json(writing, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Failed to create external writing' },
      { status: 400 }
    );
  }
}
