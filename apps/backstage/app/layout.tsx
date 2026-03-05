import './styles.css';
import { BaseProvider } from '@packages/base';
import { fonts } from '@packages/base/lib/fonts';
import { cn } from '@packages/base/lib/utils';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: {
    default: 'Backstage',
    template: '%s | Backstage',
  },
  description: 'Admin dashboard for itsyogesh.fyi',
  robots: { index: false, follow: false },
};

const RootLayout = ({ children }: { children: ReactNode }) => (
  <html
    lang="en"
    className={cn(fonts, 'scroll-smooth')}
    suppressHydrationWarning
  >
    <body className="min-h-screen" suppressHydrationWarning>
      <BaseProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        {children}
      </BaseProvider>
    </body>
  </html>
);

export default RootLayout;
