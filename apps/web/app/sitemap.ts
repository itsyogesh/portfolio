import { blog } from '@packages/cms';
import { database } from '@packages/db';
import type { MetadataRoute } from 'next';

const url = new URL(
  process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:3000'
);

const sitemap = async (): Promise<MetadataRoute.Sitemap> => {
  const pages = ['', '/about', '/projects', '/writing', '/stack', '/stars', '/bookmarks'];
  const articles = blog.getPosts().map((p) => `/writing/${p._slug}`);
  const projects = await database.project.findMany({ select: { slug: true } });
  const projectPaths = projects.map((p) => `/projects/${p.slug}`);

  return [...pages, ...articles, ...projectPaths].map((path) => ({
    url: new URL(path, url).href,
    lastModified: new Date(),
  }));
};

export default sitemap;
