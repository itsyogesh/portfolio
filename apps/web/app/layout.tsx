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

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getProfile();
  const name = profile?.name || 'Yogesh Kumar';

  return {
    title: {
      default: name,
      template: `%s | ${name}`,
    },
    description: profile?.headline || 'Full-stack builder. 12+ years shipping products.',
    metadataBase: new URL(
      process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : 'http://localhost:3000'
    ),
  };
}

const RootLayout = async ({ children }: { children: ReactNode }) => {
  const profile = await getProfile();
  const profileName = profile?.name || 'Yogesh Kumar';
  const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:3000';

  const webSiteJsonLd: WithContext<WebSite> = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: profileName,
    url: siteUrl,
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
