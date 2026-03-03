import { requireAdminPage } from '../api/_lib/auth';
import type { Metadata } from 'next';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@packages/base/components/ui/tabs';
import { Badge } from '@packages/base/components/ui/badge';
import { ExternalWritingTable } from './components/external-writing-table';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Writing',
  description: 'Manage articles and external writing',
};

type ArticleMeta = {
  slug: string;
  title: string;
  date: string;
  tags: string[];
};

function getArticles(): ArticleMeta[] {
  try {
    const articlesDir =
      process.env.CONTENT_DIR
        ? join(process.env.CONTENT_DIR, 'articles')
        : join(process.cwd(), '..', '..', 'content', 'articles');
    const files = readdirSync(articlesDir).filter((f) => f.endsWith('.mdx'));
    return files
      .map((file) => {
        const raw = readFileSync(join(articlesDir, file), 'utf-8');
        const match = raw.match(/^---\n([\s\S]*?)\n---/);
        if (!match) return null;
        const fm: Record<string, string> = {};
        for (const line of match[1].split('\n')) {
          const idx = line.indexOf(':');
          if (idx === -1) continue;
          const key = line.slice(0, idx).trim();
          let val = line.slice(idx + 1).trim();
          if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
          fm[key] = val;
        }
        let tags: string[] = [];
        const tagsMatch = match[1].match(/tags:\s*\[([^\]]*)\]/);
        if (tagsMatch) {
          tags = tagsMatch[1]
            .split(',')
            .map((t) => t.trim().replace(/"/g, ''))
            .filter(Boolean);
        }
        return {
          slug: file.replace('.mdx', ''),
          title: fm.title || file.replace('.mdx', ''),
          date: fm.date || '',
          tags,
        };
      })
      .filter(Boolean) as ArticleMeta[];
  } catch {
    return [];
  }
}

export default async function WritingPage() {
  await requireAdminPage();

  const articles = getArticles().sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl tracking-tight mb-2">Writing</h1>
        <p className="text-sm text-muted-foreground">
          Manage your MDX articles and external writing
        </p>
      </div>

      <Tabs defaultValue="articles">
        <TabsList>
          <TabsTrigger value="articles">Articles</TabsTrigger>
          <TabsTrigger value="external">External</TabsTrigger>
        </TabsList>

        <TabsContent value="articles" className="mt-4">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {articles.length} MDX{' '}
              {articles.length === 1 ? 'article' : 'articles'} (read-only,
              managed as files)
            </p>

            {articles.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground border border-dashed rounded-lg">
                No MDX articles found. Add .mdx files to the content/articles
                directory.
              </div>
            ) : (
              <div className="divide-y divide-border rounded-lg border">
                {articles.map((article) => (
                  <div
                    key={article.slug}
                    className="flex items-center gap-4 px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm truncate">
                          {article.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {article.date && (
                          <span className="text-xs text-muted-foreground">
                            {new Date(article.date).toLocaleDateString(
                              'en-US',
                              {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              }
                            )}
                          </span>
                        )}
                        {article.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {article.slug}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="external" className="mt-4">
          <ExternalWritingTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}
