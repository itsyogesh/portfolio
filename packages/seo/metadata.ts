import merge from 'lodash.merge';
import type { Metadata } from 'next';

export type MetadataGenerator = Omit<Metadata, 'description' | 'title'> & {
  title: string;
  description: string;
  image?: string;
  authorName?: string;
  authorUrl?: string;
  twitterHandle?: string;
};

const configuredSiteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:4000');

export const createMetadata = ({
  title,
  description,
  image,
  authorName,
  authorUrl,
  twitterHandle,
  ...properties
}: MetadataGenerator): Metadata => {
  const appName = authorName || 'Portfolio';
  const author: Metadata['authors'] = {
    name: appName,
    url: authorUrl || configuredSiteUrl,
  };

  const parsedTitle = `${title} | ${appName}`;
  const defaultMetadata: Metadata = {
    title,
    description,
    applicationName: appName,
    metadataBase: new URL(configuredSiteUrl),
    authors: [author],
    creator: author.name,
    formatDetection: {
      telephone: false,
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: parsedTitle,
    },
    openGraph: {
      title: parsedTitle,
      description,
      type: 'website',
      siteName: appName,
      locale: 'en_US',
    },
    publisher: appName,
    twitter: {
      card: 'summary_large_image',
      ...(twitterHandle && { creator: twitterHandle }),
    },
  };

  const metadata: Metadata = merge(defaultMetadata, properties);

  if (image && metadata.openGraph) {
    metadata.openGraph.images = [
      {
        url: image,
        width: 1200,
        height: 630,
        alt: title,
      },
    ];
  }

  return metadata;
};
