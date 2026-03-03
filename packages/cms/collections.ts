import { defineCollection, defineConfig } from '@content-collections/core';
import { compileMDX } from '@content-collections/mdx';
import { z } from 'zod';

const articles = defineCollection({
  name: 'articles',
  directory: '../../content/articles',
  include: '**/*.mdx',
  schema: z.object({
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

const projects = defineCollection({
  name: 'projects',
  directory: '../../content/projects',
  include: '**/*.mdx',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.string(),
    status: z.enum(['active', 'shipped', 'building', 'legacy', 'concept']),
    category: z.enum(['saas', 'web3', 'agency', 'education', 'consumer', 'fintech', 'commerce']),
    tech: z.array(z.string()).optional(),
    url: z.string().optional(),
    github: z.string().optional(),
    featured: z.boolean().optional(),
    order: z.number().optional(),
  }),
  transform: async ({ title, ...page }, context) => {
    const body = await context.cache(page.content, async () =>
      compileMDX(context, page)
    );
    return {
      ...page,
      _title: title,
      _slug: page._meta.path,
      body,
    };
  },
});

export default defineConfig({
  collections: [articles, projects],
});
