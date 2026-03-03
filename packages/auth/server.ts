import 'server-only';

import { database } from '@packages/db';
import { type BetterAuthOptions, betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { nextCookies } from 'better-auth/next-js';

const authOptions = {
  baseURL:
    process.env.BETTER_AUTH_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : 'http://localhost:3001'),

  database: prismaAdapter(database, {
    provider: 'postgresql',
  }),

  trustedOrigins: [
    'http://localhost:3000',
    'http://localhost:3001',
    ...(process.env.NODE_ENV === 'production'
      ? ['https://itsyogesh.fyi', 'https://backstage.itsyogesh.fyi']
      : []),
  ],

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },

  ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
    ? {
        socialProviders: {
          github: {
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
          },
        },
      }
    : {}),

  plugins: [nextCookies()],
} satisfies BetterAuthOptions;

export const auth = betterAuth(authOptions) as ReturnType<
  typeof betterAuth<typeof authOptions>
>;
