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
  const [profile, timeline, nowProjects, experience, accolades, orgs, education, stackItems] =
    await Promise.all([
      getProfile(),
      database.timelineEntry.findMany({
        orderBy: [{ position: 'asc' }],
      }),
      database.project.findMany({
        where: { featured: true },
        orderBy: { position: 'asc' },
      }),
      database.workExperience.findMany({
        orderBy: { position: 'asc' },
        include: { organization: true },
      }),
      database.accolade.findMany({ orderBy: { position: 'asc' } }),
      database.organization.findMany({ select: { name: true, website: true } }),
      database.education.findMany({ select: { institution: true } }),
      database.stackItem.findMany({ select: { name: true } }),
    ]);

  const companies = nowProjects.filter((p) => p.category === 'company');
  const projects = nowProjects.filter((p) => p.category !== 'company');
  const employment = experience.filter((r) => r.type !== 'freelance');
  const freelance = experience.filter((r) => r.type === 'freelance');
  const formatYear = (d: Date) => new Date(d).getFullYear();
  const formatRange = (start: Date, end: Date | null) => {
    const from = formatYear(start);
    const to = end ? formatYear(end) : null;
    if (to === null) return `${from}–now`;
    return to === from ? `${from}` : `${from}–${to}`;
  };

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

      {/* Now — companies and projects */}
      {nowProjects.length > 0 && (
        <section className="mb-20 space-y-10">
          {[
            { label: 'Companies', items: companies },
            { label: 'Projects', items: projects },
          ]
            .filter((group) => group.items.length > 0)
            .map((group) => (
              <div key={group.label}>
                <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">
                  {group.label}
                </h2>
                <div className="space-y-1">
                  {group.items.map((project) => (
                    <Link
                      key={project.slug}
                      href={`/projects/${project.slug}`}
                      className="group flex items-baseline justify-between gap-6 py-4 border-b border-border/50 hover:border-border transition-colors"
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        {project.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={project.imageUrl} alt="" className="mt-0.5 h-6 w-6 shrink-0 rounded-md object-contain" />
                        ) : (
                          <span aria-hidden="true" className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted text-[11px] font-semibold text-muted-foreground">
                            {project.title.charAt(0)}
                          </span>
                        )}
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
                      </div>
                      <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </Link>
                  ))}
                </div>
              </div>
            ))}
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

      {/* Experience */}
      {[
        { heading: 'Experience', roles: employment },
        { heading: 'Freelance', roles: freelance },
      ]
        .filter((group) => group.roles.length > 0)
        .map((group) => (
          <section key={group.heading} className="mb-20">
            <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-6">
              {group.heading}
            </h2>
            <div className="space-y-1">
              {group.roles.map((role) => (
                <div
                  key={role.id}
                  className="flex items-start justify-between gap-6 py-4 border-b border-border/50"
                >
                  <div className="flex min-w-0 items-start gap-3.5">
                    {role.organization.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={role.organization.logoUrl}
                        alt=""
                        className="mt-0.5 h-6 w-6 shrink-0 rounded-md object-contain"
                      />
                    ) : (
                      <span
                        aria-hidden="true"
                        className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted text-[11px] font-semibold text-muted-foreground"
                      >
                        {role.organization.name.charAt(0)}
                      </span>
                    )}
                    <div className="min-w-0 space-y-1">
                      <h3 className="font-medium text-foreground">
                        {role.title} ·{' '}
                        <span className="text-muted-foreground font-normal">
                          {role.organization.name}
                        </span>
                      </h3>
                      {role.highlights[0] ? (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {role.highlights[0]}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground/70 tabular-nums shrink-0 pt-0.5">
                    {formatRange(role.startDate, role.endDate)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        ))}

      {/* Recognition */}
      {accolades.length > 0 && (
        <section className="mb-20">
          <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-6">
            Recognition
          </h2>
          <div className="space-y-1">
            {accolades.map((accolade) => (
              <div
                key={accolade.id}
                className="flex items-baseline justify-between gap-6 py-4 border-b border-border/50"
              >
                <div className="min-w-0 space-y-1">
                  <h3 className="font-medium text-foreground">
                    {accolade.title}
                  </h3>
                  {accolade.issuer ? (
                    <p className="text-sm text-muted-foreground">
                      {accolade.issuer}
                    </p>
                  ) : null}
                </div>
                {accolade.date ? (
                  <span className="text-xs text-muted-foreground/70 tabular-nums shrink-0">
                    {formatYear(accolade.date)}
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Milestones */}
      {timeline.length > 0 && (
        <section className="mb-20">
          <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-6">
            Milestones
          </h2>
          <div className="space-y-1">
            {timeline.map((item) => (
              <div
                key={`${item.year}-${item.title}`}
                className="grid grid-cols-[3.5rem_1fr] gap-6 py-4 border-b border-border/50"
              >
                <span className="text-sm text-muted-foreground/70 tabular-nums pt-0.5">
                  {item.year}
                </span>
                <div className="space-y-1">
                  <h3 className="font-medium text-foreground">{item.title}</h3>
                  {item.description ? (
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
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
