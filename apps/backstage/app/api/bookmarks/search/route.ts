import { database } from '@packages/db';
import { type NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../../_lib/auth';

// GET /api/bookmarks/search?q=query (admin only)
export async function GET(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(request.url);

  const query = searchParams.get('q')?.trim();
  if (!query || query.length < 2) {
    return NextResponse.json(
      { error: 'Query must be at least 2 characters' },
      { status: 400 }
    );
  }

  const limit = Math.min(
    Number.parseInt(searchParams.get('limit') || '30', 10),
    100
  );

  const bookmarks = await database.bookmark.findMany({
    where: {
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { url: { contains: query, mode: 'insensitive' } },
        { summary: { contains: query, mode: 'insensitive' } },
        { excerpt: { contains: query, mode: 'insensitive' } },
        { tags: { has: query } },
      ],
    },
    take: limit,
    orderBy: { savedAt: 'desc' },
    select: {
      id: true,
      title: true,
      url: true,
      category: true,
      tags: true,
      summary: true,
      excerpt: true,
      siteName: true,
      imageUrl: true,
      isPublic: true,
      savedAt: true,
    },
  });

  return NextResponse.json({ bookmarks, total: bookmarks.length });
}
