import { database } from '@packages/db';
import { cache } from 'react';

export const getProfile = cache(async () => {
  return database.profile.findFirst({
    include: { socials: { orderBy: { position: 'asc' } } },
  });
});
