import 'dotenv/config';
import { prisma } from './lib/db';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

type PocketBookmark = {
  title: string;
  url: string;
  category: string;
  tags: string[];
  date: string | null;
  archived?: boolean;
  originalUrl?: string;
};

const BATCH_SIZE = 500;

async function main() {
  try {
    const filePath = join(process.cwd(), 'content/pages/bookmarks.json');
    const raw = readFileSync(filePath, 'utf-8');
    const bookmarks: PocketBookmark[] = JSON.parse(raw);

    console.log(`Found ${bookmarks.length} bookmarks in JSON file`);

    // Get existing URLs for idempotency
    const existing = await prisma.bookmark.findMany({
      select: { url: true },
    });
    const existingUrls = new Set(existing.map((b) => b.url));
    console.log(`${existingUrls.size} bookmarks already in database`);

    // Deduplicate by URL and filter already-imported
    const seen = new Set<string>();
    const toInsert = bookmarks.filter((b) => {
      if (seen.has(b.url) || existingUrls.has(b.url)) return false;
      seen.add(b.url);
      return true;
    });

    console.log(`${toInsert.length} new bookmarks to insert`);

    if (toInsert.length === 0) {
      console.log('Nothing to migrate.');
      return;
    }

    // Insert in batches
    let inserted = 0;
    for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
      const batch = toInsert.slice(i, i + BATCH_SIZE);

      await prisma.bookmark.createMany({
        data: batch.map((b) => ({
          title: b.title,
          url: b.url,
          originalUrl: b.originalUrl ?? null,
          archived: b.archived ?? false,
          category: b.category || 'Other',
          tags: b.tags || [],
          savedAt: b.date ? new Date(b.date) : null,
          isPublic: true,
          extractionStatus: 'pending',
          aiStatus: 'pending',
        })),
        skipDuplicates: true,
      });

      inserted += batch.length;
      console.log(
        `Inserted ${inserted}/${toInsert.length} (${Math.round((inserted / toInsert.length) * 100)}%)`
      );
    }

    console.log(`Migration complete. ${inserted} bookmarks inserted.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
