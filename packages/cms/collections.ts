import { defineCollection, defineConfig } from '@content-collections/core';
import { compileMDX } from '@content-collections/mdx';
import { z } from 'zod';

const articles = defineCollection({
  name: 'articles',
  directory: '../../content/articles',
  include: '**/*.mdx',
  schema: z.object({
    content: z.string(),
    title: z.string(),
    description: z.string(),
    date: z.string(),
    tags: z.array(z.string()).optional(),
  }),
  transform: async ({ title, ...page }, context) => {
    const body = await context.cache(page.content, async () =>
      compileMDX(context, page)
    );
    const readingTime = Math.ceil(page.content.split(/\s+/).length / 200);
    return {
      ...page,
      _title: title,
      _slug: page._meta.path,
      body,
      readingTime,
    };
  },
});

export default defineConfig({
  content: [articles],
});
