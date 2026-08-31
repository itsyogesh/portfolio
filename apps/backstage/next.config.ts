import { fileURLToPath } from 'node:url';
import type { NextConfig } from 'next';

const outputFileTracingRoot = fileURLToPath(new URL('../..', import.meta.url));

const nextConfig: NextConfig = {
  outputFileTracingRoot,
  poweredByHeader: false,
  outputFileTracingIncludes: {
    '/writing': ['../../content/articles/**/*.mdx'],
    '/api/universities': ['../../data/universities.json'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'no-referrer' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000',
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      { hostname: 'avatars.githubusercontent.com' },
      { hostname: 'www.google.com' },
    ],
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;
