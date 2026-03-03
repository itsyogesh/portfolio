import merge from 'lodash.merge';
import type { Metadata } from 'next';

type MetadataGenerator = Omit<Metadata, 'description' | 'title'> & {
  title: string;
  description: string;
  image?: string;
  authorName?: string;
  authorUrl?: string;
  twitterHandle?: string;
};

const defaultAuthorName = 'Yogesh Kumar';
const defaultAuthorUrl = 'https://itsyogesh.fyi/';
const defaultTwitterHandle = '@itsyogesh18';
const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
const productionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL || 'itsyogesh.fyi';

export const createMetadata = ({
  title,
  description,
  image,
  authorName,
  authorUrl,
  twitterHandle,
  ...properties
}: MetadataGenerator): Metadata => {
  const appName = authorName || defaultAuthorName;
  const author: Metadata['authors'] = {
    name: appName,
    url: authorUrl || defaultAuthorUrl,
  };
  const twitter = twitterHandle || defaultTwitterHandle;

  const parsedTitle = `${title} | ${appName}`;
  const defaultMetadata: Metadata = {
    title: parsedTitle,
    description,
    applicationName: appName,
    metadataBase: productionUrl
      ? new URL(`${protocol}://${productionUrl}`)
      : undefined,
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
      creator: twitter,
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
