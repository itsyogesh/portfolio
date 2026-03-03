import { requireAdminPage } from '../api/_lib/auth';
import { database } from '@packages/db';
import type { Metadata } from 'next';
import { AdminBookmarkList } from './components/admin-bookmark-list';
import { ProcessingStatus } from './components/processing-status';
import { AddBookmarkForm } from './components/add-bookmark-form';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Bookmarks',
  description: 'Manage bookmarks',
};

export default async function AdminBookmarksPage() {
  await requireAdminPage();
  const [
    total,
    pendingExtraction,
    pendingAi,
    failedExtraction,
    failedAi,
    doneExtraction,
    doneAi,
    bookmarks,
  ] = await Promise.all([
    database.bookmark.count(),
    database.bookmark.count({ where: { extractionStatus: 'pending' } }),
    database.bookmark.count({
      where: { aiStatus: 'pending', extractionStatus: 'done' },
    }),
    database.bookmark.count({ where: { extractionStatus: 'failed' } }),
    database.bookmark.count({ where: { aiStatus: 'failed' } }),
    database.bookmark.count({ where: { extractionStatus: 'done' } }),
    database.bookmark.count({ where: { aiStatus: 'done' } }),
    database.bookmark.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        title: true,
        url: true,
        category: true,
        isPublic: true,
        isFeatured: true,
        extractionStatus: true,
        aiStatus: true,
        savedAt: true,
        createdAt: true,
      },
    }),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-6 pt-8 pb-20">
      <div className="mb-8">
        <h1 className="font-display text-3xl tracking-tight mb-2">
          Bookmarks
        </h1>
        <p className="text-sm text-muted-foreground">
          {total.toLocaleString()} bookmarks total
        </p>
      </div>

      <ProcessingStatus
        stats={{
          total,
          pendingExtraction,
          pendingAi,
          failedExtraction,
          failedAi,
          doneExtraction,
          doneAi,
        }}
      />

      <div className="mt-8">
        <h2 className="font-display text-xl mb-4">Add Bookmark</h2>
        <AddBookmarkForm />
      </div>

      <div className="mt-8">
        <h2 className="font-display text-xl mb-4">Recent Bookmarks</h2>
        <AdminBookmarkList
          bookmarks={bookmarks.map((b) => ({
            ...b,
            savedAt: b.savedAt?.toISOString() ?? null,
            createdAt: b.createdAt.toISOString(),
          }))}
        />
      </div>
    </div>
  );
}
