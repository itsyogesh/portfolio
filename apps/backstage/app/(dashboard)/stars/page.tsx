import { requireAdminPage } from '../../api/_lib/auth';
import { database } from '@packages/db';
import type { Metadata } from 'next';
import { StarKanban } from './components/star-kanban';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Stars',
  description: 'Manage GitHub starred repos',
};

export default async function StarsPage() {
  await requireAdminPage();

  const [lists, repos] = await Promise.all([
    database.starList.findMany({
      orderBy: { position: 'asc' },
      include: {
        _count: {
          select: { repos: true },
        },
      },
    }),
    database.starRepo.findMany({
      where: { isStarred: true },
      orderBy: { position: 'asc' },
      include: {
        list: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    }),
  ]);

  return (
    <div className="px-6 pt-8 pb-20">
      <StarKanban
        initialLists={lists.map((l) => ({
          id: l.id,
          name: l.name,
          description: l.description,
          color: l.color,
          position: l.position,
          repoCount: l._count.repos,
        }))}
        initialRepos={repos.map((r) => ({
          id: r.id,
          githubId: r.githubId,
          fullName: r.fullName,
          htmlUrl: r.htmlUrl,
          description: r.description,
          language: r.language,
          stargazersCount: r.stargazersCount,
          topics: r.topics,
          avatarUrl: r.avatarUrl,
          position: r.position,
          listId: r.listId,
        }))}
      />
    </div>
  );
}
