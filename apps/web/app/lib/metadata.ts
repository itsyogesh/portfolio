import {
  createMetadata,
  type MetadataGenerator,
} from '@packages/seo/metadata';
import { getProfile } from './profile';
import { getSiteUrl } from './site';

type ProfileMetadataInput = Omit<
  MetadataGenerator,
  'authorName' | 'authorUrl' | 'twitterHandle'
> & {
  path?: string;
};

function getTwitterHandle(
  socials: Array<{ platform: string; url: string }>
): string | undefined {
  const twitter = socials.find((social) =>
    ['twitter', 'x'].includes(social.platform.toLowerCase())
  );
  if (!twitter) return undefined;

  try {
    const handle = new URL(twitter.url).pathname.split('/').filter(Boolean)[0];
    return handle ? `@${handle.replace(/^@/, '')}` : undefined;
  } catch {
    return undefined;
  }
}

export async function createProfileMetadata({
  path = '/',
  ...input
}: ProfileMetadataInput) {
  const profile = await getProfile();
  const siteUrl = getSiteUrl();
  const canonical = new URL(path, siteUrl).href;

  return createMetadata({
    ...input,
    authorName: profile?.name || 'Portfolio',
    authorUrl: profile?.website || siteUrl.href,
    twitterHandle: getTwitterHandle(profile?.socials || []),
    alternates: {
      ...input.alternates,
      canonical,
    },
    openGraph: {
      ...input.openGraph,
      url: canonical,
    },
  });
}
