import { database } from '@packages/db';
import { createMetadata } from '@packages/seo/metadata';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { BookmarkFilters } from './components/bookmark-filters';
import { BookmarkList, BookmarkListSkeleton } from './components/bookmark-list';
import { BookmarkSearch } from './components/bookmark-search';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = createMetadata({
  title: 'Bookmarks',
  description:
    'A collection of 4,000+ articles, tools, and resources saved over 12 years.',
});

type BookmarksPageProps = {
  searchParams: Promise<{
    page?: string;
    category?: string;
    q?: string;
  }>;
};

async function BookmarksContent({
  searchParams,
}: {
  searchParams: { page?: string; category?: string; q?: string };
}) {
  const page = Number.parseInt(searchParams.page || '1', 10);
  const limit = 50;
  const category = searchParams.category;
  const query = searchParams.q;

  const where: Record<string, unknown> = { isPublic: true };

  if (category) {
    where.category = category;
  }

  if (query && query.length >= 2) {
    where.OR = [
      { title: { contains: query, mode: 'insensitive' } },
      { url: { contains: query, mode: 'insensitive' } },
      { summary: { contains: query, mode: 'insensitive' } },
      { tags: { has: query } },
    ];
  }

  const [bookmarks, total, categoryCountsRaw] = await Promise.all([
    database.bookmark.findMany({
      where,
      orderBy: { savedAt: 'desc' },
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
        siteName: true,
        imageUrl: true,
        isPublic: true,
        savedAt: true,
        extractionStatus: true,
      },
    }),
    database.bookmark.count({ where }),
    database.bookmark.groupBy({
      by: ['category'],
      where: { isPublic: true },
      _count: true,
    }),
  ]);

  const categoryCounts: Record<string, number> = {};
  for (const row of categoryCountsRaw) {
    categoryCounts[row.category] = row._count;
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <>
      <BookmarkFilters categoryCounts={categoryCounts} />
      <BookmarkList
        initialBookmarks={bookmarks.map((b) => ({
          ...b,
          savedAt: b.savedAt?.toISOString() ?? null,
        }))}
        totalPages={totalPages}
        currentPage={page}
      />
      <p className="text-xs text-muted-foreground/40 text-center mt-8">
        {total.toLocaleString()} bookmarks
        {category ? ` in ${category}` : ''}
        {query ? ` matching "${query}"` : ''}
      </p>
    </>
  );
}

export default async function BookmarksPage({ searchParams }: BookmarksPageProps) {
  const params = await searchParams;

  return (
    <div className="mx-auto max-w-2xl px-6 pt-24 pb-20">
      <section className="mb-12">
        <h1 className="font-display text-3xl tracking-tight mb-4">
          Bookmarks
        </h1>
        <p className="text-muted-foreground leading-relaxed mb-6">
          Articles, tools, research, and rabbit holes — saved over 12 years.
        </p>
        <BookmarkSearch />
      </section>

      <Suspense fallback={<BookmarkListSkeleton />}>
        <BookmarksContent searchParams={params} />
      </Suspense>
    </div>
  );
}
