import { database } from '@packages/db';
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
  const project = await database.project.findUnique({ where: { slug } });
  if (!project) notFound();

  return (
    <div className="mx-auto max-w-3xl px-6 py-16 space-y-8">
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

        <div className="flex flex-wrap gap-2">
          <span className="text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground">
            {project.status}
          </span>
          {project.category && (
            <span className="text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground">
              {project.category}
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
