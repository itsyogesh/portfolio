import { database } from '@packages/db';
import { createMetadata } from '@packages/seo/metadata';
import { Star } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = createMetadata({
  title: 'Stars',
  description: 'GitHub repositories I\'ve starred — tools, libraries, and projects I find interesting.',
});

const StarsPage = async () => {
  const [lists, unsortedRepos] = await Promise.all([
    database.starList.findMany({
      include: {
        repos: {
          where: { isStarred: true },
          orderBy: { position: 'asc' },
        },
      },
      orderBy: { position: 'asc' },
    }),
    database.starRepo.findMany({
      where: { isStarred: true, listId: null },
      orderBy: { stargazersCount: 'desc' },
    }),
  ]);

  // Group unsorted repos by language
  const groupedByLanguage = unsortedRepos.reduce<
    Record<string, typeof unsortedRepos>
  >((acc, repo) => {
    const lang = repo.language || 'Other';
    if (!acc[lang]) acc[lang] = [];
    acc[lang].push(repo);
    return acc;
  }, {});

  const languages = Object.keys(groupedByLanguage).sort();
  const hasLists = lists.some((l) => l.repos.length > 0);

  return (
    <div className="mx-auto max-w-3xl px-6 py-16 space-y-16">
      <section className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">Stars</h1>
        <p className="text-muted-foreground">
          GitHub repositories I find interesting. Synced from GitHub, organized
          into lists.
        </p>
      </section>

      {/* Curated lists */}
      {hasLists &&
        lists
          .filter((l) => l.repos.length > 0)
          .map((list) => (
            <section key={list.id} className="space-y-4">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                {list.name}
              </h2>
              {list.description && (
                <p className="text-xs text-muted-foreground">
                  {list.description}
                </p>
              )}
              <div className="space-y-1">
                {list.repos.map((repo) => (
                  <RepoRow key={repo.id} repo={repo} />
                ))}
              </div>
            </section>
          ))}

      {/* Ungrouped by language */}
      {languages.map((lang) => (
        <section key={lang} className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            {lang}
          </h2>
          <div className="space-y-1">
            {groupedByLanguage[lang].map((repo) => (
              <RepoRow key={repo.id} repo={repo} />
            ))}
          </div>
        </section>
      ))}

      {unsortedRepos.length === 0 && !hasLists && (
        <p className="text-muted-foreground">
          No starred repos yet. Check back later.
        </p>
      )}
    </div>
  );
};

function RepoRow({
  repo,
}: {
  repo: {
    id: string;
    fullName: string;
    htmlUrl: string;
    description: string | null;
    stargazersCount: number;
  };
}) {
  return (
    <Link
      href={repo.htmlUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block group"
    >
      <div className="flex items-start justify-between py-3 -mx-3 px-3 rounded-lg hover:bg-muted/50 transition-colors">
        <div className="space-y-1 min-w-0">
          <h3 className="font-medium text-sm text-foreground group-hover:text-foreground/80 font-mono">
            {repo.fullName}
          </h3>
          {repo.description && (
            <p className="text-sm text-muted-foreground line-clamp-1">
              {repo.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0 ml-4">
          <Star className="h-3 w-3" />
          {repo.stargazersCount.toLocaleString()}
        </div>
      </div>
    </Link>
  );
}

export default StarsPage;
