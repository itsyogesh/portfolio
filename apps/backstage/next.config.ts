import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: 'avatars.githubusercontent.com' },
      { hostname: 'www.google.com' },
    ],
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;
