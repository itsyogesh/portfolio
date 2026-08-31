import { database } from '@packages/db';
import { JsonLd, type WithContext, type CreativeWork } from '@packages/seo/json-ld';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { createProfileMetadata } from '../../lib/metadata';
import { getProfile } from '../../lib/profile';

type Props = {
  params: Promise<{ slug: string }>;
};

const statusLabel: Record<string, string> = {
  active: 'Active',
  building: 'Building',
  shipped: 'Shipped',
  archived: 'Archived',
};

const statusDot: Record<string, string> = {
  active: 'bg-emerald-500',
  building: 'bg-amber-500',
  shipped: 'bg-sky-500',
  archived: 'bg-zinc-400',
};

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const { slug } = await params;
  const project = await database.project.findUnique({ where: { slug } });
  if (!project) return {};
  return createProfileMetadata({
    title: project.title,
    description: project.summary || '',
    path: `/projects/${project.slug}`,
  });
};

const GitHubMark = () => (
  <svg viewBox="0 0 16 16" className="h-4 w-4" fill="currentColor" aria-hidden="true">
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
  </svg>
);

const ProjectPage = async ({ params }: Props) => {
  const { slug } = await params;
  const [project, profile] = await Promise.all([
    database.project.findUnique({
      where: { slug },
      include: { organization: true },
    }),
    getProfile(),
  ]);
  if (!project) notFound();

  const siteHost = project.url
    ? new URL(project.url).hostname.replace(/^www\./, '')
    : null;

  const jsonLd: WithContext<CreativeWork> = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: project.title,
    description: project.summary ?? undefined,
    url: project.url ?? undefined,
    author: {
      '@type': 'Person',
      name: profile?.name ?? 'Portfolio owner',
      url: profile?.website ?? undefined,
    },
    ...(project.organization && {
      sourceOrganization: {
        '@type': 'Organization' as const,
        name: project.organization.name,
        url: project.organization.website ?? undefined,
      },
    }),
  };

  return (
    <div className="mx-auto max-w-2xl px-6 pt-24 pb-20">
      <JsonLd code={jsonLd} />

      <Link
        href="/projects"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> All projects
      </Link>

      {/* Header */}
      <header className="mt-10 mb-14">
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            {project.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={project.imageUrl}
                alt=""
                className="mb-6 h-12 w-12 rounded-xl object-contain"
              />
            ) : (
              <span
                aria-hidden="true"
                className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-lg font-semibold text-muted-foreground"
              >
                {project.title.charAt(0)}
              </span>
            )}
            <h1 className="font-display text-4xl sm:text-5xl tracking-tight leading-[1.08] text-balance">
              {project.title}
            </h1>
          </div>
          <span className="mt-1 inline-flex shrink-0 items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
            <span
              className={`h-1.5 w-1.5 rounded-full ${statusDot[project.status] ?? 'bg-zinc-400'}`}
            />
            {statusLabel[project.status] ?? project.status}
          </span>
        </div>

        {project.summary && (
          <p className="mt-5 text-lg text-muted-foreground leading-relaxed max-w-lg">
            {project.summary}
          </p>
        )}

        {(project.url || project.githubUrl) && (
          <div className="mt-7 flex flex-wrap items-center gap-x-7 gap-y-3">
            {project.url && (
              <Link
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-medium text-foreground border-b border-foreground pb-0.5 hover:opacity-60 transition-opacity"
              >
                {siteHost}
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            )}
            {project.githubUrl && (
              <Link
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <GitHubMark />
                GitHub
              </Link>
            )}
          </div>
        )}
      </header>

      {/* Body */}
      {project.content && (
        <article className="prose prose-neutral dark:prose-invert max-w-none prose-p:leading-relaxed prose-headings:font-display prose-headings:font-normal prose-headings:tracking-tight prose-h2:text-2xl prose-a:decoration-border prose-a:underline-offset-4 hover:prose-a:decoration-foreground">
          <Markdown remarkPlugins={[remarkGfm]}>{project.content}</Markdown>
        </article>
      )}

      {/* Footer meta */}
      <footer className="mt-16 border-t border-border pt-8 space-y-6">
        {project.tech.length > 0 && (
          <div>
            <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
              Stack
            </h2>
            <div className="flex flex-wrap gap-2">
              {project.tech.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}
        {project.organization && (
          <p className="text-sm text-muted-foreground">
            {project.category === 'company' ? 'Company' : 'Under'}:{' '}
            {project.organization.website ? (
              <Link
                href={project.organization.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground hover:opacity-60 transition-opacity"
              >
                {project.organization.name}
              </Link>
            ) : (
              <span className="text-foreground">{project.organization.name}</span>
            )}
          </p>
        )}
      </footer>
    </div>
  );
};

export default ProjectPage;
