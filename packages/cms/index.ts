// @ts-ignore - content-collections will be generated
import { allArticles, type Article } from 'content-collections';

export type { Article };

export const blog = {
  getPosts: (): Article[] => allArticles || [],
  getLatestPosts: (count = 3): Article[] => {
    if (!allArticles || allArticles.length === 0) return [];
    return allArticles
      .sort(
        (a: Article, b: Article) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
      )
      .slice(0, count);
  },
  getPost: (slug: string): Article | null => {
    if (!allArticles) return null;
    return allArticles.find((post: Article) => post._slug === slug) || null;
  },
};
