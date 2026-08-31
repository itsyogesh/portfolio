import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import { getProfile } from './lib/profile';
import { getSiteUrl } from './lib/site';

export const runtime = 'nodejs';
export const alt = 'Portfolio';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const fontsDir = join(process.cwd(), 'assets', 'fonts');

export default async function Image() {
  const [profile, siteUrl, serif, sans, avatar] =
    await Promise.all([
      getProfile(),
      getSiteUrl(),
      readFile(join(fontsDir, 'InstrumentSerif-Regular.ttf')),
      readFile(join(fontsDir, 'Inter-Regular.ttf')),
      readFile(join(process.cwd(), 'public', 'avatar.jpg')).catch(() => null),
    ]);

  const name = profile?.name || 'Portfolio';
  const headline = profile?.headline || 'Projects, writing, and work.';
  const website = (profile?.website || siteUrl.href).replace(
    /^https?:\/\//,
    '',
  );
  const avatarSrc = avatar
    ? `data:image/jpeg;base64,${avatar.toString('base64')}`
    : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: '#0a0a0a',
          padding: '0 96px',
          position: 'relative',
          fontFamily: 'Inter',
        }}
      >
        {avatarSrc ? (
          <img
            src={avatarSrc}
            width={128}
            height={128}
            style={{
              borderRadius: 128,
              objectFit: 'cover',
              border: '1px solid rgba(237,237,237,0.18)',
              boxShadow: '0 0 90px 34px rgba(245,245,244,0.12)',
            }}
          />
        ) : null}
        <span
          style={{
            fontFamily: 'Instrument Serif',
            fontSize: 76,
            color: '#f5f5f4',
            letterSpacing: '-1px',
            lineHeight: 1.05,
            marginTop: 44,
          }}
        >
          {name}
        </span>
        <span
          style={{
            fontSize: 27,
            color: '#a8a29e',
            lineHeight: 1.5,
            marginTop: 20,
            maxWidth: 660,
          }}
        >
          {headline}
        </span>
        <div
          style={{
            position: 'absolute',
            right: 64,
            bottom: 56,
            display: 'flex',
            alignItems: 'center',
            padding: '12px 24px',
            borderRadius: 999,
            border: '1px solid rgba(237,237,237,0.14)',
            background: 'rgba(255,255,255,0.04)',
            fontSize: 19,
            color: '#a8a29e',
          }}
        >
          {website}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Instrument Serif', data: serif, weight: 400, style: 'normal' },
        { name: 'Inter', data: sans, weight: 400, style: 'normal' },
      ],
    },
  );
}
