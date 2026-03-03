'use client';

import { createAuthClient } from 'better-auth/react';

const client = createAuthClient({
  baseURL:
    typeof window !== 'undefined'
      ? `${window.location.origin}/api/auth`
      : `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/api/auth`,
});

export const signIn = client.signIn;
export const signOut = client.signOut;
export const signUp = client.signUp;
export const useSession = client.useSession;
