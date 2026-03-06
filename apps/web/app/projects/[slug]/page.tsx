import { database } from '@packages/db';
import { JsonLd, type WithContext, type CreativeWork } from '@packages/seo/json-ld';
import { createMetadata } from '@packages/seo/metadata';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type Props = {
  params: Promise<{ slug: string }>;
};

export const generateStaticParams = async () => {
  const projects = await database.project.findMany({
    select: { slug: true },
  });
  return projects.map((p) => ({ slug: p.slug }));
};

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const { slug } = await params;
  const project = await database.project.findUnique({ where: { slug } });
  if (!project) return {};
  return createMetadata({
    title: project.title,
    description: project.summary || '',
  });
};

const ProjectPage = async ({ params }: Props) => {
  const { slug } = await params;
  const [project, profile] = await Promise.all([
    database.project.findUnique({
      where: { slug },
      include: { organization: true },
    }),
    database.profile.findFirst({ select: { name: true, website: true } }),
  ]);
  if (!project) notFound();

  const jsonLd: WithContext<CreativeWork> = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: project.title,
    description: project.summary ?? undefined,
    url: project.url ?? undefined,
    author: {
      '@type': 'Person',
      name: profile?.name ?? 'Yogesh Kumar',
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
    <div className="mx-auto max-w-3xl px-6 py-16 space-y-8">
      <JsonLd code={jsonLd} />
      <Link
        href="/projects"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3 w-3" /> Back to projects
      </Link>

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">{project.title}</h1>
          {project.url && (
            <Link
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
            </Link>
          )}
        </div>
        {project.summary && (
          <p className="text-muted-foreground">{project.summary}</p>
        )}

        {project.organization && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {project.organization.logoUrl && (
              <img
                src={project.organization.logoUrl}
                alt={project.organization.name}
                className="h-5 w-5 rounded"
              />
            )}
            <span>
              {project.organization.website ? (
                <Link
                  href={project.organization.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  {project.organization.name}
                </Link>
              ) : (
                project.organization.name
              )}
            </span>
            {project.role && (
              <>
                <span className="text-muted-foreground/50">/</span>
                <span className="capitalize">{project.role}</span>
              </>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <span className="text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground">
            {project.status}
          </span>
          {project.category && (
            <span className="text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground">
              {project.category}
            </span>
          )}
          {project.kind && (
            <span className="text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground capitalize">
              {project.kind}
            </span>
          )}
          {project.tech?.map((t) => (
            <span
              key={t}
              className="text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground"
            >
              {t}
            </span>
          ))}
        </div>

        {project.highlights.length > 0 && (
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            {project.highlights.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        )}
      </div>

      {project.content && (
        <article className="prose prose-neutral dark:prose-invert max-w-none">
          <Markdown remarkPlugins={[remarkGfm]}>{project.content}</Markdown>
        </article>
      )}
    </div>
  );
};

export default ProjectPage;
