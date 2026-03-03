import 'dotenv/config';
import { prisma } from './lib/db';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText, Output } from 'ai';
import { z } from 'zod';

const CONCURRENCY = 5;
const BATCH_SIZE = 50;

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  compatibility: 'strict',
});
const model = openai('gpt-4o-mini');

const categories = [
  'Engineering',
  'Design',
  'Business',
  'Science',
  'Culture',
  'Reading',
  'Other',
] as const;

const bookmarkAnalysisSchema = z.object({
  summary: z
    .string()
    .describe('A concise 1-2 sentence summary of the article content'),
  category: z
    .enum(categories)
    .describe('The best-fitting category for this article'),
  suggestedTags: z
    .array(z.string())
    .max(5)
    .describe('Up to 5 relevant tags for categorization'),
});

async function processBookmark(bookmark: {
  id: string;
  title: string;
  url: string;
  excerpt: string | null;
  category: string;
}) {
  try {
    // Mark as processing
    await prisma.bookmark.update({
      where: { id: bookmark.id },
      data: { aiStatus: 'processing' },
    });

    const content = bookmark.excerpt
      ? bookmark.excerpt.slice(0, 2000)
      : 'No content available';

    const { output } = await generateText({
      model,
      output: Output.object({ schema: bookmarkAnalysisSchema }),
      prompt: `Analyze this bookmarked article and provide a summary, category, and tags.

Title: ${bookmark.title}
URL: ${bookmark.url}
Current Category: ${bookmark.category}
Content: ${content}`,
    });

    if (output) {
      await prisma.bookmark.update({
        where: { id: bookmark.id },
        data: {
          summary: output.summary,
          category: output.category,
          tags:
            output.suggestedTags.length > 0
              ? output.suggestedTags
              : undefined,
          aiStatus: 'done',
        },
      });
      return { id: bookmark.id, status: 'done' };
    }

    await prisma.bookmark.update({
      where: { id: bookmark.id },
      data: { aiStatus: 'failed' },
    });
    return { id: bookmark.id, status: 'failed', error: 'No output' };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await prisma.bookmark.update({
      where: { id: bookmark.id },
      data: { aiStatus: 'failed' },
    });
    return { id: bookmark.id, status: 'failed', error: message };
  }
}

async function main() {
  const total = await prisma.bookmark.count({
    where: {
      aiStatus: 'pending',
      extractionStatus: 'done',
    },
  });
  console.log(`${total} bookmarks ready for AI processing`);

  let processed = 0;
  let succeeded = 0;
  let failed = 0;

  while (true) {
    const batch = await prisma.bookmark.findMany({
      where: {
        aiStatus: 'pending',
        extractionStatus: 'done',
      },
      select: {
        id: true,
        title: true,
        url: true,
        excerpt: true,
        category: true,
      },
      take: BATCH_SIZE,
    });

    if (batch.length === 0) break;

    // Process in concurrent chunks
    for (let i = 0; i < batch.length; i += CONCURRENCY) {
      const chunk = batch.slice(i, i + CONCURRENCY);
      const results = await Promise.allSettled(
        chunk.map((b) => processBookmark(b))
      );

      for (const r of results) {
        if (r.status === 'fulfilled' && r.value.status === 'done') {
          succeeded++;
        } else {
          failed++;
        }
      }
    }

    processed += batch.length;
    console.log(
      `Progress: ${processed}/${total} (${succeeded} ok, ${failed} failed)`
    );
  }

  console.log(
    `\nAI processing complete: ${succeeded} succeeded, ${failed} failed`
  );
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('AI processing failed:', err);
  process.exit(1);
});
