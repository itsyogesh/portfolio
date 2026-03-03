import { withCMS } from '@packages/cms/next-config';
import type { NextConfig } from 'next';

const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'www.google.com',
      },
    ],
  },
} satisfies NextConfig;

export default withCMS(nextConfig);
