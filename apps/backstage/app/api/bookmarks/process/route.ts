import { database } from '@packages/db';
import { NextResponse } from 'next/server';
import { requireAdmin } from '../../_lib/auth';

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
    // Silently fail
  }

  if (!favicon) {
    const domain = getDomain(url);
    if (domain) {
      favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
    }
  }

  return { favicon, ogImage };
}

// POST /api/bookmarks/process — trigger extraction/AI for pending bookmarks (admin only)
export async function POST() {
  const { error } = await requireAdmin();
  if (error) return error;

  const [pendingExtraction, pendingAi, failedExtraction, failedAi] =
    await Promise.all([
      database.bookmark.count({ where: { extractionStatus: 'pending' } }),
      database.bookmark.count({
        where: { aiStatus: 'pending', extractionStatus: 'done' },
      }),
      database.bookmark.count({ where: { extractionStatus: 'failed' } }),
      database.bookmark.count({ where: { aiStatus: 'failed' } }),
    ]);

  const BATCH_SIZE = 5;
  const toExtract = await database.bookmark.findMany({
    where: { extractionStatus: 'pending' },
    select: { id: true, url: true },
    take: BATCH_SIZE,
  });

  let extracted = 0;
  let extractFailed = 0;

  for (const bookmark of toExtract) {
    try {
      const [article, { favicon, ogImage }] = await Promise.all([
        import('@extractus/article-extractor').then((m) =>
          m.extract(bookmark.url)
        ),
        fetchFaviconAndOgImage(bookmark.url),
      ]);

      if (article?.content) {
        const fullText =
          article.content.length > 100_000
            ? article.content.slice(0, 100_000)
            : article.content;
        const textOnly = article.content.replace(/<[^>]*>/g, '').trim();
        const imageUrl = article.image ?? ogImage ?? null;

        await database.bookmark.update({
          where: { id: bookmark.id },
          data: {
            fullText,
            excerpt: textOnly.slice(0, 300),
            author: article.author ?? null,
            siteName: article.source ?? null,
            imageUrl,
            favicon,
            extractionStatus: 'done',
            extractionError: null,
          },
        });
        extracted++;
      } else {
        await database.bookmark.update({
          where: { id: bookmark.id },
          data: {
            extractionStatus: 'done',
            favicon,
            imageUrl: ogImage,
          },
        });
        extracted++;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await database.bookmark.update({
        where: { id: bookmark.id },
        data: {
          extractionStatus: 'failed',
          extractionError: msg.slice(0, 500),
        },
      });
      extractFailed++;
    }
  }

  return NextResponse.json({
    processed: { extracted, extractFailed },
    pending: {
      extraction: pendingExtraction - extracted,
      ai: pendingAi,
    },
    failed: {
      extraction: failedExtraction + extractFailed,
      ai: failedAi,
    },
  });
}
