import { Timeline } from '@packages/base/components/ui/timeline';
import { database } from '@packages/db';
import { JsonLd, type WithContext, type ProfilePage } from '@packages/seo/json-ld';
import { createMetadata } from '@packages/seo/metadata';
import type { Metadata } from 'next';
import Markdown from 'react-markdown';
import { getProfile } from '../lib/profile';

export const generateMetadata = async (): Promise<Metadata> => {
  const profile = await getProfile();
  const name = profile?.name || 'Yogesh Kumar';
  const headline = profile?.headline || 'Full-stack builder';
  return createMetadata({
    title: 'About',
    description: `The story of ${name} — ${headline}.`,
  });
};

const AboutPage = async () => {
  const [profile, timeline, projectCount, orgCount, accoladeCount, orgs, education, stackItems] =
    await Promise.all([
      getProfile(),
      database.timelineEntry.findMany({
        orderBy: [{ position: 'asc' }],
      }),
      database.project.count(),
      database.organization.count(),
      database.accolade.count({ where: { type: 'hackathon' } }),
      database.organization.findMany({ select: { name: true, website: true } }),
      database.education.findMany({ select: { institution: true } }),
      database.stackItem.findMany({ select: { name: true } }),
    ]);

  const stats = [
    { label: 'Years building', value: '12+' },
    { label: 'Products shipped', value: `${projectCount}+` },
    { label: 'Hackathons won', value: String(accoladeCount || 3) },
    { label: 'Ventures', value: String(orgCount || 6) },
  ];

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
    <div className="mx-auto max-w-3xl px-6 py-16 space-y-16">
      <JsonLd code={jsonLd} />
      <section className="space-y-6">
        <h1 className="font-display text-3xl tracking-tight">About</h1>
        {profile?.bio ? (
          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <Markdown>{profile.bio}</Markdown>
          </div>
        ) : (
          <p className="text-muted-foreground">No bio set yet.</p>
        )}
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 gap-6 sm:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="space-y-1">
            <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </section>

      {/* Timeline */}
      <section className="space-y-6">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Timeline
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
    </div>
  );
};

export default AboutPage;
