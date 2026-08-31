import { database } from '@packages/db';
import type { Metadata } from 'next';
import Link from 'next/link';
import { createProfileMetadata } from '../lib/metadata';

export const generateMetadata = async (): Promise<Metadata> =>
  createProfileMetadata({
    title: 'Projects',
    description: 'Ventures, products, open-source work, and experiments.',
    path: '/projects',
  });

const statusOrder = ['active', 'building', 'shipped', 'legacy', 'concept'] as const;

const statusLabel: Record<string, string> = {
  active: 'Active',
  building: 'Building',
  shipped: 'Shipped',
  legacy: 'Legacy',
  concept: 'Concept',
};

const categoryLabel: Record<string, string> = {
  company: 'Company',
  venture: 'Venture',
  saas: 'SaaS',
  web3: 'Web3',
  agency: 'Agency',
  education: 'EdTech',
  consumer: 'Consumer',
  fintech: 'Fintech',
  commerce: 'Commerce',
};

const ProjectsPage = async () => {
  const allProjects = await database.project.findMany({
    orderBy: { position: 'asc' },
    include: { organization: { select: { name: true } } },
  });

  const companies = allProjects.filter((p) => p.category === 'company');
  const ventures = allProjects.filter((p) => p.category === 'venture');
  const rest = allProjects.filter(
    (p) => p.category !== 'company' && p.category !== 'venture',
  );

  const grouped = [
    { status: 'companies', label: 'Companies', projects: companies },
    ...statusOrder.map((status) => ({
      status,
      label: statusLabel[status],
      projects: rest.filter((p) => p.status === status),
    })),
    { status: 'ventures', label: 'Earlier ventures', projects: ventures },
  ].filter((g) => g.projects.length > 0);

  return (
    <div className="mx-auto max-w-3xl px-6 py-16 space-y-16">
      <section className="space-y-4">
        <h1 className="font-display text-3xl tracking-tight">Work</h1>
        <p className="text-muted-foreground">
          The companies I run, the projects I keep building, and the ventures
          that taught me how.
        </p>
      </section>

      {grouped.map((group) => (
        <section key={group.status} className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            {group.label}
          </h2>
          <div className="space-y-1">
            {group.projects.map((project) => (
              <Link
                key={project.slug}
                href={`/projects/${project.slug}`}
                className="block group"
              >
                <div className="flex items-start justify-between py-3 -mx-3 px-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-foreground group-hover:text-foreground/80">
                        {project.title}
                      </h3>
                      {project.organization && (
                        <span className="text-xs text-muted-foreground px-1.5 py-0.5 rounded bg-muted/80">
                          {project.organization.name}
                        </span>
                      )}
                      {project.category && (
                        <span className="text-xs text-muted-foreground px-1.5 py-0.5 rounded bg-muted">
                          {categoryLabel[project.category] || project.category}
                        </span>
                      )}
                      {project.kind && (
                        <span className="text-xs text-muted-foreground px-1.5 py-0.5 rounded bg-muted capitalize">
                          {project.kind}
                        </span>
                      )}
                    </div>
                    {project.summary && (
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {project.summary}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

export default ProjectsPage;
