import { ImageResponse } from 'next/og';
import { getProfile } from './lib/profile';
import { getSiteUrl } from './lib/site';

export const alt = 'Portfolio';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  const [profile, siteUrl] = await Promise.all([getProfile(), getSiteUrl()]);
  const name = profile?.name || 'Portfolio';
  const headline = profile?.headline || 'Projects, writing, and work.';
  const website = profile?.website || siteUrl.hostname;

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
