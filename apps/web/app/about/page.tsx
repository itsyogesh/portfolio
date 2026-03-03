import { database } from '@packages/db';
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
  const [profile, timeline, projectCount, orgCount, accoladeCount] =
    await Promise.all([
      getProfile(),
      database.timelineEntry.findMany({
        orderBy: [{ position: 'asc' }],
      }),
      database.project.count(),
      database.organization.count(),
      database.accolade.count({ where: { type: 'hackathon' } }),
    ]);

  const stats = [
    { label: 'Years building', value: '12+' },
    { label: 'Products shipped', value: `${projectCount}+` },
    { label: 'Hackathons won', value: String(accoladeCount || 3) },
    { label: 'Ventures', value: String(orgCount || 6) },
  ];

  return (
    <div className="mx-auto max-w-3xl px-6 py-16 space-y-16">
      <section className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">About</h1>
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
        <div className="space-y-0">
          {timeline.map((item) => (
            <div
              key={item.id}
              className="flex gap-6 py-4 border-b border-border/50 last:border-0"
            >
              <span className="text-sm text-muted-foreground w-12 shrink-0 pt-0.5">
                {item.year}
              </span>
              <div className="space-y-1">
                <h3 className="font-medium text-sm">{item.title}</h3>
                {item.description && (
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
