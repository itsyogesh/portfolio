import 'dotenv/config';
import { prisma } from './lib/db';
import { extract } from '@extractus/article-extractor';

const CONCURRENCY = 10;
const BATCH_DELAY_MS = 500;
const BATCH_SIZE = 50;

function getDomain(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

async function fetchFaviconAndOgImage(
  url: string
): Promise<{ favicon: string | null; ogImage: string | null }> {
  let favicon: string | null = null;
  let ogImage: string | null = null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BookmarkBot/1.0)' },
      redirect: 'follow',
    });
    clearTimeout(timeout);

    const html = await res.text();

    // Parse favicon from <link rel="icon"> or <link rel="shortcut icon">
    const faviconMatch = html.match(
      /<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["']/i
    ) ?? html.match(
      /<link[^>]*href=["']([^"']+)["'][^>]*rel=["'](?:shortcut )?icon["']/i
    );

    if (faviconMatch?.[1]) {
      try {
        favicon = new URL(faviconMatch[1], url).href;
      } catch {
        favicon = faviconMatch[1];
      }
    }

    // Parse og:image
    const ogMatch = html.match(
      /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i
    ) ?? html.match(
      /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i
    );

    if (ogMatch?.[1]) {
      try {
        ogImage = new URL(ogMatch[1], url).href;
      } catch {
        ogImage = ogMatch[1];
      }
    }
  } catch {
    // Silently fail — we'll use fallbacks
  }

  // Fallback favicon via Google's service
  if (!favicon) {
    const domain = getDomain(url);
    if (domain) {
      favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
    }
  }

  return { favicon, ogImage };
}

async function extractBookmark(id: string, url: string) {
  try {
    const [article, { favicon, ogImage }] = await Promise.all([
      extract(url),
      fetchFaviconAndOgImage(url),
    ]);

    if (!article || !article.content) {
      await prisma.bookmark.update({
        where: { id },
        data: {
          extractionStatus: 'done',
          excerpt: null,
          fullText: null,
          favicon,
          imageUrl: ogImage,
        },
      });
      return { id, status: 'no-content' };
    }

    // Truncate fullText at 100KB
    const fullText =
      article.content.length > 100_000
        ? article.content.slice(0, 100_000)
        : article.content;

    // Generate excerpt from text content (strip HTML tags)
    const textOnly = article.content.replace(/<[^>]*>/g, '').trim();
    const excerpt = textOnly.slice(0, 300);

    // Use article image, fall back to OG image
    const imageUrl = article.image ?? ogImage ?? null;

    await prisma.bookmark.update({
      where: { id },
      data: {
        fullText,
        excerpt,
        author: article.author ?? null,
        siteName: article.source ?? null,
        imageUrl,
        favicon,
        extractionStatus: 'done',
        extractionError: null,
      },
    });

    return { id, status: 'done' };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await prisma.bookmark.update({
      where: { id },
      data: {
        extractionStatus: 'failed',
        extractionError: message.slice(0, 500),
      },
    });
    return { id, status: 'failed', error: message };
  }
}

async function processBatch(
  bookmarks: { id: string; url: string }[]
): Promise<void> {
  const chunks: { id: string; url: string }[][] = [];
  for (let i = 0; i < bookmarks.length; i += CONCURRENCY) {
    chunks.push(bookmarks.slice(i, i + CONCURRENCY));
  }

  for (const chunk of chunks) {
    const results = await Promise.allSettled(
      chunk.map((b) => extractBookmark(b.id, b.url))
    );

    const done = results.filter(
      (r) => r.status === 'fulfilled' && r.value.status === 'done'
    ).length;
    const noContent = results.filter(
      (r) => r.status === 'fulfilled' && r.value.status === 'no-content'
    ).length;
    const failed = results.filter(
      (r) =>
        r.status === 'rejected' ||
        (r.status === 'fulfilled' && r.value.status === 'failed')
    ).length;

    console.log(
      `  Chunk: ${done} extracted, ${noContent} no-content, ${failed} failed`
    );

    // Rate limit delay
    await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
  }
}

async function main() {
  const total = await prisma.bookmark.count({
    where: { extractionStatus: 'pending' },
  });
  console.log(`${total} bookmarks pending extraction`);

  let processed = 0;
  while (true) {
    const batch = await prisma.bookmark.findMany({
      where: { extractionStatus: 'pending' },
      select: { id: true, url: true },
      take: BATCH_SIZE,
    });

    if (batch.length === 0) break;

    console.log(
      `Processing batch ${processed + 1}-${processed + batch.length} of ${total}`
    );
    await processBatch(batch);
    processed += batch.length;
    console.log(`Progress: ${processed}/${total}`);
  }

  // Print summary
  const stats = await prisma.$queryRaw<
    { status: string; count: bigint }[]
  >`SELECT "extractionStatus" as status, COUNT(*) as count FROM "bookmark" GROUP BY "extractionStatus"`;

  console.log('\nExtraction summary:');
  for (const row of stats) {
    console.log(`  ${row.status}: ${row.count}`);
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Extraction failed:', err);
  process.exit(1);
});
