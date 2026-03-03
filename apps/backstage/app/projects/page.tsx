import { requireAdminPage } from '../api/_lib/auth';
import { database } from '@packages/db';
import type { Metadata } from 'next';
import { ProjectTable } from './components/project-table';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Projects',
  description: 'Manage projects',
};

export default async function ProjectsPage() {
  await requireAdminPage();

  const projects = await database.project.findMany({
    orderBy: { position: 'asc' },
  });

  const serializedProjects = projects.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    summary: p.summary,
    content: p.content,
    status: p.status,
    category: p.category,
    tech: p.tech,
    url: p.url,
    githubUrl: p.githubUrl,
    imageUrl: p.imageUrl,
    featured: p.featured,
    position: p.position,
    startDate: p.startDate?.toISOString().split('T')[0] ?? null,
    endDate: p.endDate?.toISOString().split('T')[0] ?? null,
  }));

  return (
    <div className="mx-auto max-w-4xl px-6 pt-8 pb-20">
      <div className="mb-8">
        <h1 className="font-display text-3xl tracking-tight mb-2">Projects</h1>
        <p className="text-sm text-muted-foreground">
          {projects.length} project{projects.length !== 1 ? 's' : ''} total
        </p>
      </div>

      <ProjectTable projects={serializedProjects} />
    </div>
  );
}
