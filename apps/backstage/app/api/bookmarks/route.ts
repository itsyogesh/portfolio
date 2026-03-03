import { database } from '@packages/db';
import { type NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../_lib/auth';

// GET /api/bookmarks — list bookmarks (admin, all bookmarks)
export async function GET(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(request.url);

  const page = Number.parseInt(searchParams.get('page') || '1', 10);
  const limit = Math.min(
    Number.parseInt(searchParams.get('limit') || '50', 10),
    100
  );
  const category = searchParams.get('category');
  const tag = searchParams.get('tag');
  const status = searchParams.get('status');
  const sort = searchParams.get('sort') || 'savedAt';
  const order = searchParams.get('order') === 'asc' ? 'asc' : 'desc';

  const where: Record<string, unknown> = {};

  if (category) {
    where.category = category;
  }

  if (tag) {
    where.tags = { has: tag };
  }

  if (status === 'featured') {
    where.isFeatured = true;
  }

  const [bookmarks, total] = await Promise.all([
    database.bookmark.findMany({
      where,
      orderBy: { [sort]: order },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        title: true,
        url: true,
        originalUrl: true,
        archived: true,
        category: true,
        tags: true,
        summary: true,
        favicon: true,
        excerpt: true,
        author: true,
        siteName: true,
        imageUrl: true,
        isPublic: true,
        isFeatured: true,
        savedAt: true,
        extractionStatus: true,
        aiStatus: true,
        createdAt: true,
      },
    }),
    database.bookmark.count({ where }),
  ]);

  return NextResponse.json({
    bookmarks,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

// POST /api/bookmarks — create a bookmark (admin only)
export async function POST(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();

    const bookmark = await database.bookmark.create({
      data: {
        title: body.title,
        url: body.url,
        originalUrl: body.originalUrl,
        category: body.category || 'Other',
        tags: body.tags || [],
        isPublic: body.isPublic ?? true,
        isFeatured: body.isFeatured ?? false,
        savedAt: body.savedAt ? new Date(body.savedAt) : new Date(),
        extractionStatus: 'pending',
        aiStatus: 'pending',
      },
    });

    return NextResponse.json(bookmark, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Failed to create bookmark' },
      { status: 400 }
    );
  }
}
