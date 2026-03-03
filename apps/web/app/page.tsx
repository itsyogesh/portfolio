import { blog } from '@packages/cms';
import { database } from '@packages/db';
import { format } from 'date-fns';
import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { getProfile } from './lib/profile';

const statusColors: Record<string, string> = {
  active: 'bg-emerald-500/15 text-emerald-400',
  building: 'bg-amber-500/15 text-amber-400',
  shipped: 'bg-sky-500/15 text-sky-400',
  legacy: 'bg-zinc-500/15 text-zinc-500',
  concept: 'bg-violet-500/15 text-violet-400',
};

const HomePage = async () => {
  const [profile, featuredProjects] = await Promise.all([
    getProfile(),
    database.project.findMany({
      where: { featured: true },
      orderBy: { position: 'asc' },
    }),
  ]);

  const latestPosts = blog.getLatestPosts(3);
  const name = profile?.name || 'Yogesh Kumar';
  const headline = profile?.headline || 'Full-stack builder. 12+ years shipping products.';

  return (
    <div className="mx-auto max-w-2xl px-6 pt-24 pb-20">
      {/* Hero */}
      <section className="mb-24">
        <h1 className="font-display text-5xl sm:text-6xl tracking-tight leading-[1.1] mb-6">
          {name}
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed max-w-lg">
          {headline} Currently building with AI agents and running{' '}
          <Link
            href="/projects"
            className="text-foreground underline underline-offset-4 decoration-muted-foreground/40 hover:decoration-foreground transition-colors"
          >
            multiple ventures
          </Link>
          .
        </p>
        <p className="mt-4 text-sm text-muted-foreground/70 font-display italic">
          Dropped out of college in 2013. Been building since.
        </p>
      </section>

      {/* Divider */}
      <div className="border-t border-border mb-16" />

      {/* Featured Projects */}
      {featuredProjects.length > 0 && (
        <section className="mb-20">
          <div className="flex items-baseline justify-between mb-8">
            <h2 className="font-display italic text-2xl text-foreground">
              Projects
            </h2>
            <Link
              href="/projects"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest"
            >
              All projects
            </Link>
          </div>
          <div className="space-y-1">
            {featuredProjects.map((project) => (
              <Link
                key={project.slug}
                href={`/projects/${project.slug}`}
                className="group flex items-center justify-between py-4 border-b border-border/50 hover:border-border transition-colors"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <h3 className="font-medium text-foreground truncate">
                    {project.title}
                  </h3>
                  <span
                    className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full shrink-0 ${statusColors[project.status] ?? 'bg-zinc-500/15 text-zinc-500'}`}
                  >
                    {project.status}
                  </span>
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all shrink-0 ml-4" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Latest Writing */}
      {latestPosts.length > 0 && (
        <section className="mb-20">
          <div className="flex items-baseline justify-between mb-8">
            <h2 className="font-display italic text-2xl text-foreground">
              Writing
            </h2>
            <Link
              href="/writing"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest"
            >
              All posts
            </Link>
          </div>
          <div className="space-y-1">
            {latestPosts.map((post) => (
              <Link
                key={post._slug}
                href={`/writing/${post._slug}`}
                className="group flex items-start justify-between py-4 border-b border-border/50 hover:border-border transition-colors"
              >
                <div className="min-w-0 space-y-1">
                  <h3 className="font-medium text-foreground">
                    {post._title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {post.description}
                  </p>
                </div>
                <time className="text-xs text-muted-foreground/70 tabular-nums shrink-0 ml-6 mt-1">
                  {format(new Date(post.date), 'MMM yyyy')}
                </time>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default HomePage;
