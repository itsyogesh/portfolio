import { Timeline } from '@packages/base/components/ui/timeline';
import { database } from '@packages/db';
import { JsonLd, type WithContext, type ProfilePage } from '@packages/seo/json-ld';
import { ArrowUpRight } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Markdown from 'react-markdown';
import { createProfileMetadata } from '../lib/metadata';
import { getProfile } from '../lib/profile';

export const generateMetadata = async (): Promise<Metadata> => {
  const profile = await getProfile();
  const name = profile?.name || 'Portfolio owner';
  const headline = profile?.headline || 'Personal portfolio';
  return createProfileMetadata({
    title: 'About',
    description: `The story of ${name} — ${headline}.`,
    path: '/about',
  });
};

const AboutPage = async () => {
  const [profile, timeline, nowProjects, orgs, education, stackItems] =
    await Promise.all([
      getProfile(),
      database.timelineEntry.findMany({
        orderBy: [{ position: 'asc' }],
      }),
      database.project.findMany({
        where: { featured: true },
        orderBy: { position: 'asc' },
        take: 4,
      }),
      database.organization.findMany({ select: { name: true, website: true } }),
      database.education.findMany({ select: { institution: true } }),
      database.stackItem.findMany({ select: { name: true } }),
    ]);

  const jsonLd: WithContext<ProfilePage> = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    mainEntity: {
      '@type': 'Person',
      name: profile?.name,
      jobTitle: profile?.headline ?? undefined,
      description: profile?.bio ?? undefined,
      image: profile?.avatarUrl ?? undefined,
      url: profile?.website ?? undefined,
      email: profile?.email ?? undefined,
      sameAs: profile?.socials.map((s) => s.url),
      worksFor: orgs.map((o) => ({
        '@type': 'Organization' as const,
        name: o.name,
        url: o.website ?? undefined,
      })),
      alumniOf: education.map((e) => ({
        '@type': 'EducationalOrganization' as const,
        name: e.institution,
      })),
      knowsAbout: stackItems.map((s) => s.name),
    },
  };

  return (
    <div className="mx-auto max-w-2xl px-6 pt-24 pb-20">
      <JsonLd code={jsonLd} />

      {/* Belief, not a label */}
      <section className="mb-20">
        <h1 className="font-display text-4xl sm:text-5xl tracking-tight leading-[1.08] mb-6 text-balance">
          I build the things I wish existed.
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed max-w-lg">
          {profile?.headline ||
            'Founder and builder, shipping software since 2013.'}
        </p>
      </section>

      {/* Now — the three tracks */}
      {nowProjects.length > 0 && (
        <section className="mb-20">
          <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-6">
            Now
          </h2>
          <div className="space-y-1">
            {nowProjects.map((project) => (
              <Link
                key={project.slug}
                href={`/projects/${project.slug}`}
                className="group flex items-baseline justify-between gap-6 py-4 border-b border-border/50 hover:border-border transition-colors"
              >
                <div className="min-w-0 space-y-1">
                  <h3 className="font-medium text-foreground">
                    {project.title}
                  </h3>
                  {project.summary ? (
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {project.summary}
                    </p>
                  ) : null}
                </div>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* The story */}
      <section className="mb-20">
        <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-6">
          The story
        </h2>
        {profile?.bio ? (
          <div className="prose prose-neutral dark:prose-invert max-w-none prose-p:leading-relaxed">
            <Markdown>{profile.bio}</Markdown>
          </div>
        ) : (
          <p className="text-muted-foreground">No bio set yet.</p>
        )}
      </section>

      {/* Milestones */}
      {timeline.length > 0 && (
        <section className="mb-20">
          <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-6">
            Milestones
          </h2>
          <Timeline
            data={timeline.map((item) => ({
              title: `${item.year} — ${item.title}`,
              content: item.description ? (
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
              ) : null,
            }))}
          />
        </section>
      )}

      {/* Next step */}
      <section className="border-t border-border pt-10">
        <p className="text-muted-foreground mb-5 max-w-md leading-relaxed">
          The clearest picture of how I work is the work itself.
        </p>
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
          <Link
            href="/projects"
            className="font-medium text-foreground border-b border-foreground pb-0.5 hover:opacity-60 transition-opacity"
          >
            See the projects
          </Link>
          <Link
            href="/writing"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Read the writing
          </Link>
          {profile?.email ? (
            <a
              href={`mailto:${profile.email}`}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Say hello
            </a>
          ) : null}
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
