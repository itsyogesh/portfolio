import { blog } from '@packages/cms';
import { database } from '@packages/db';
import { createMetadata } from '@packages/seo/metadata';
import { ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = createMetadata({
  title: 'Writing',
  description: 'Articles on building products, design systems, AI tools, and Web3.',
});

const sourceLabel: Record<string, string> = {
  substack: 'Substack',
  medium: 'Medium',
  twitter: 'Twitter',
  devto: 'Dev.to',
  hashnode: 'Hashnode',
  youtube: 'YouTube',
};

const WritingPage = async () => {
  const mdxPosts = blog.getPosts();
  const externalWriting = await database.externalWriting.findMany({
    orderBy: { publishedAt: 'desc' },
  });

  // Merge into a unified feed sorted by date
  type FeedItem =
    | { type: 'mdx'; slug: string; title: string; description: string; date: Date }
    | { type: 'external'; id: string; title: string; url: string; source: string | null; summary: string | null; date: Date };

  const feed: FeedItem[] = [
    ...mdxPosts.map((post) => ({
      type: 'mdx' as const,
      slug: post._slug,
      title: post._title,
      description: post.description,
      date: new Date(post.date),
    })),
    ...externalWriting.map((ew) => ({
      type: 'external' as const,
      id: ew.id,
      title: ew.title,
      url: ew.url,
      source: ew.source,
      summary: ew.summary,
      date: ew.publishedAt || ew.createdAt,
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  const grouped = feed.reduce<Record<string, FeedItem[]>>((acc, item) => {
    const year = item.date.getFullYear().toString();
    if (!acc[year]) acc[year] = [];
    acc[year].push(item);
    return acc;
  }, {});

  const years = Object.keys(grouped).sort((a, b) => Number(b) - Number(a));

  return (
    <div className="mx-auto max-w-3xl px-6 py-16 space-y-16">
      <section className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">Writing</h1>
        <p className="text-muted-foreground">
          Thoughts on building products, design, AI tools, and the Web3 ecosystem.
        </p>
      </section>

      {years.map((year) => (
        <section key={year} className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            {year}
          </h2>
          <div className="space-y-1">
            {grouped[year].map((item) => {
              if (item.type === 'mdx') {
                return (
                  <Link
                    key={item.slug}
                    href={`/writing/${item.slug}`}
                    className="block group"
                  >
                    <div className="flex items-start justify-between py-3 -mx-3 px-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="space-y-1">
                        <h3 className="font-medium text-foreground group-hover:text-foreground/80">
                          {item.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {item.description}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground mt-1 shrink-0 ml-4">
                        {format(item.date, 'MMM d')}
                      </span>
                    </div>
                  </Link>
                );
              }

              return (
                <Link
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block group"
                >
                  <div className="flex items-start justify-between py-3 -mx-3 px-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-foreground group-hover:text-foreground/80">
                          {item.title}
                        </h3>
                        <ExternalLink className="h-3 w-3 text-muted-foreground" />
                        {item.source && (
                          <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 rounded bg-muted">
                            {sourceLabel[item.source] || item.source}
                          </span>
                        )}
                      </div>
                      {item.summary && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {item.summary}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground mt-1 shrink-0 ml-4">
                      {format(item.date, 'MMM d')}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ))}

      {feed.length === 0 && (
        <p className="text-muted-foreground">No articles yet. Check back soon.</p>
      )}
    </div>
  );
};

export default WritingPage;
