import { database } from '@packages/db';
import { ImageResponse } from 'next/og';

export const alt = 'Portfolio';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  const profile = await database.profile.findFirst();
  const name = profile?.name || 'Yogesh Kumar';
  const headline =
    profile?.headline || 'Full-stack builder. 12+ years shipping products.';
  const website = profile?.website || 'itsyogesh.fyi';

  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 48,
          background: '#0a0a0a',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'flex-end',
          padding: 80,
          gap: 16,
        }}
      >
        <span
          style={{
            fontSize: 64,
            fontWeight: 700,
            color: '#ededed',
            letterSpacing: '-2px',
          }}
        >
          {name}
        </span>
        <span
          style={{
            fontSize: 28,
            color: '#737373',
          }}
        >
          {headline}
        </span>
        <span
          style={{
            fontSize: 20,
            color: '#525252',
            marginTop: 8,
          }}
        >
          {website.replace(/^https?:\/\//, '')}
        </span>
      </div>
    ),
    { ...size }
  );
}
