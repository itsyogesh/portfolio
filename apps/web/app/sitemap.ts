import { blog } from '@packages/cms';
import { database } from '@packages/db';
import type { MetadataRoute } from 'next';
import { getSiteUrl } from './lib/site';

export const revalidate = 60;

const sitemap = async (): Promise<MetadataRoute.Sitemap> => {
  const url = getSiteUrl();
  const pages = ['', '/about', '/projects', '/writing', '/stack', '/stars', '/bookmarks'];
  const articles = blog.getPosts().map((post) => ({
    url: new URL(`/writing/${post._slug}`, url).href,
    lastModified: new Date(post.date),
  }));
  const [projects, eventTypes] = await Promise.all([
    database.project.findMany({ select: { slug: true, updatedAt: true } }),
    database.eventType.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    }),
  ]);
  const projectPaths = projects.map((project) => ({
    url: new URL(`/projects/${project.slug}`, url).href,
    lastModified: project.updatedAt,
  }));
  const schedulePaths = eventTypes.map((eventType) => ({
    url: new URL(`/schedule/${eventType.slug}`, url).href,
    lastModified: eventType.updatedAt,
  }));
  const staticPages = pages.map((path) => ({ url: new URL(path, url).href }));

  if (eventTypes.length > 0) {
    staticPages.push({ url: new URL('/schedule', url).href });
  }

  return [...staticPages, ...articles, ...projectPaths, ...schedulePaths];
};

export default sitemap;
