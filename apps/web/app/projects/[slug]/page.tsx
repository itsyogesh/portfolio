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
  const [project, profile, stackItems] = await Promise.all([
    database.project.findUnique({
      where: { slug },
      include: { organization: true },
    }),
    getProfile(),
    database.stackItem.findMany({
      select: { name: true, iconSlug: true, logoUrl: true },
    }),
  ]);
  if (!project) notFound();

  const products =
    (project.products as
      | { name: string; url?: string; icon?: string; summary?: string }[]
      | null) ?? [];
  const stack = project.tech.map((t) => ({
    name: t,
    item: stackItems.find((s) => s.name.toLowerCase() === t.toLowerCase()),
  }));

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
        className="group inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
        Projects
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

      {/* Products */}
      {products.length > 0 && (
        <section className="mb-14">
          <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">
            What we&apos;re building
          </h2>
          <div className="space-y-1">
            {products.map((product) => {
              const row = (
                <div className="flex items-start gap-3.5 py-4">
                  {product.icon ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.icon}
                      alt=""
                      className="mt-0.5 h-7 w-7 shrink-0 rounded-lg object-contain"
                    />
                  ) : (
                    <span
                      aria-hidden="true"
                      className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-semibold text-muted-foreground"
                    >
                      {product.name.charAt(0)}
                    </span>
                  )}
                  <div className="min-w-0 space-y-1">
                    <h3 className="font-medium text-foreground inline-flex items-center gap-1.5">
                      {product.name}
                      {product.url ? (
                        <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 -translate-x-0.5 group-hover/product:opacity-100 group-hover/product:translate-x-0 transition-all" />
                      ) : null}
                    </h3>
                    {product.summary ? (
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {product.summary}
                      </p>
                    ) : null}
                  </div>
                </div>
              );
              return product.url ? (
                <Link
                  key={product.name}
                  href={product.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group/product block border-b border-border/50 hover:border-border transition-colors"
                >
                  {row}
                </Link>
              ) : (
                <div
                  key={product.name}
                  className="border-b border-border/50"
                >
                  {row}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Body */}
      {project.content && (
        <article className="prose prose-neutral dark:prose-invert max-w-none prose-p:leading-relaxed prose-headings:font-display prose-headings:font-normal prose-headings:tracking-tight prose-h2:text-2xl prose-a:decoration-border prose-a:underline-offset-4 hover:prose-a:decoration-foreground">
          <Markdown remarkPlugins={[remarkGfm]}>{project.content}</Markdown>
        </article>
      )}

      {/* Footer meta */}
      <footer className="mt-16 border-t border-border pt-8 space-y-6">
        {stack.length > 0 && (
          <div>
            <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">
              Stack
            </h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {stack.map(({ name, item }) => (
                <div
                  key={name}
                  className="flex items-center gap-3 rounded-lg border border-border/50 p-3"
                >
                  {item?.iconSlug || item?.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={
                        item.iconSlug
                          ? `https://cdn.simpleicons.org/${item.iconSlug}`
                          : item.logoUrl || ''
                      }
                      alt=""
                      className={`h-5 w-5 shrink-0 object-contain${item.iconSlug ? ' dark:invert' : ''}`}
                    />
                  ) : (
                    <span
                      aria-hidden="true"
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-muted text-[10px] font-semibold text-muted-foreground"
                    >
                      {name.charAt(0)}
                    </span>
                  )}
                  <span className="truncate text-sm font-medium">{name}</span>
                </div>
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
