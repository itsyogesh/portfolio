// @ts-ignore - content-collections will be generated
import { allArticles, allProjects } from 'content-collections';
import type { Article, Project } from 'content-collections';

export type { Article, Project };

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

export const ventures = {
  getAll: (): Project[] => allProjects || [],
  getFeatured: (): Project[] => {
    if (!allProjects) return [];
    return allProjects
      .filter((p: Project) => p.featured)
      .sort((a: Project, b: Project) => (a.order ?? 99) - (b.order ?? 99));
  },
  getByCategory: (category: string): Project[] => {
    if (!allProjects) return [];
    return allProjects.filter((p: Project) => p.category === category);
  },
  getByStatus: (status: string): Project[] => {
    if (!allProjects) return [];
    return allProjects.filter((p: Project) => p.status === status);
  },
  getProject: (slug: string): Project | null => {
    if (!allProjects) return null;
    return allProjects.find((p: Project) => p._slug === slug) || null;
  },
};
