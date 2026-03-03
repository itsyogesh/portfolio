import { requireAdminPage } from '../api/_lib/auth';
import { database } from '@packages/db';
import type { Metadata } from 'next';
import { ProfileForm } from './components/profile-form';
import { SocialLinksManager } from './components/social-links-manager';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Profile',
  description: 'Manage your profile',
};

export default async function ProfilePage() {
  await requireAdminPage();

  const profile = await database.profile.findUnique({
    where: { id: 'owner' },
    include: { socials: { orderBy: { position: 'asc' } } },
  });

  const serializedProfile = profile
    ? {
        id: profile.id,
        name: profile.name,
        headline: profile.headline,
        bio: profile.bio,
        avatarUrl: profile.avatarUrl,
        location: profile.location,
        website: profile.website,
        resumeUrl: profile.resumeUrl,
      }
    : null;

  const serializedSocials = profile
    ? profile.socials.map((s) => ({
        id: s.id,
        platform: s.platform,
        url: s.url,
        label: s.label,
        position: s.position,
      }))
    : [];

  return (
    <div className="mx-auto max-w-4xl px-6 pt-8 pb-20">
      <div className="mb-8">
        <h1 className="font-display text-3xl tracking-tight mb-2">Profile</h1>
        <p className="text-sm text-muted-foreground">
          Manage your personal profile and social links
        </p>
      </div>

      <div className="space-y-10">
        <div>
          <h2 className="font-display text-xl mb-4">Profile Details</h2>
          <ProfileForm profile={serializedProfile} />
        </div>

        <div>
          <h2 className="font-display text-xl mb-4">Social Links</h2>
          <SocialLinksManager socials={serializedSocials} />
        </div>
      </div>
    </div>
  );
}
