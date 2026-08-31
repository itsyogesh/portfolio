import './styles.css';
import { BaseProvider } from '@packages/base';
import { fonts } from '@packages/base/lib/fonts';
import { cn } from '@packages/base/lib/utils';
import { JsonLd, type WithContext, type WebSite } from '@packages/seo/json-ld';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Footer } from './components/footer';
import { Header } from './components/header';
import { getProfile } from './lib/profile';
import { getSiteUrl } from './lib/site';

// Backstage edits become visible within one minute without requiring a deploy.
export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getProfile();
  const name = profile?.name || 'Portfolio';
  const siteUrl = getSiteUrl();

  return {
    title: {
      default: name,
      template: `%s | ${name}`,
    },
    description: profile?.headline || 'Personal portfolio',
    metadataBase: siteUrl,
    authors: [{ name, url: profile?.website || siteUrl }],
    creator: name,
    publisher: name,
    alternates: { canonical: siteUrl.href },
    openGraph: {
      type: 'website',
      title: name,
      description: profile?.headline || 'Personal portfolio',
      siteName: name,
      url: siteUrl,
    },
    twitter: { card: 'summary_large_image' },
  };
}

const RootLayout = async ({ children }: { children: ReactNode }) => {
  const profile = await getProfile();
  const profileName = profile?.name || 'Portfolio';
  const siteUrl = getSiteUrl();

  const webSiteJsonLd: WithContext<WebSite> = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: profileName,
    url: siteUrl.href,
    description: profile?.headline ?? undefined,
  };

  return (
    <html
      lang="en"
      className={cn(fonts, 'scroll-smooth')}
      suppressHydrationWarning
    >
      <body className="min-h-screen flex flex-col" suppressHydrationWarning>
        <JsonLd code={webSiteJsonLd} />
        <BaseProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <Header profileName={profileName} />
          <main className="flex-1">{children}</main>
          <Footer />
        </BaseProvider>
      </body>
    </html>
  );
};

export default RootLayout;
