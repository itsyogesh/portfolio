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
  const [profile, siteUrl, serif, serifItalic, sans, avatar] =
    await Promise.all([
      getProfile(),
      getSiteUrl(),
      readFile(join(fontsDir, 'InstrumentSerif-Regular.ttf')),
      readFile(join(fontsDir, 'InstrumentSerif-Italic.ttf')),
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
          background: '#0a0a0a',
          position: 'relative',
          fontFamily: 'Inter',
        }}
      >
        {/* soft glow behind the portrait */}
        <div
          style={{
            position: 'absolute',
            right: -140,
            top: -140,
            width: 640,
            height: 640,
            borderRadius: 640,
            background:
              'radial-gradient(circle, rgba(120,113,108,0.35) 0%, rgba(120,113,108,0.12) 45%, rgba(10,10,10,0) 70%)',
            display: 'flex',
          }}
        />
        {/* dotted texture, lower left */}
        <div
          style={{
            position: 'absolute',
            left: 64,
            bottom: 48,
            right: 64,
            height: 1,
            background:
              'linear-gradient(90deg, rgba(237,237,237,0.28) 0%, rgba(237,237,237,0.05) 60%, rgba(237,237,237,0) 100%)',
            display: 'flex',
          }}
        />

        {/* text block */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '0 64px',
            width: 760,
            gap: 4,
          }}
        >
          <span
            style={{
              fontFamily: 'Instrument Serif',
              fontStyle: 'italic',
              fontSize: 30,
              color: '#a8a29e',
              marginBottom: 18,
            }}
          >
            {website}
          </span>
          <span
            style={{
              fontFamily: 'Instrument Serif',
              fontSize: 110,
              color: '#f5f5f4',
              letterSpacing: '-2px',
              lineHeight: 1.02,
            }}
          >
            {name}
          </span>
          <span
            style={{
              fontSize: 28,
              color: '#a8a29e',
              lineHeight: 1.45,
              marginTop: 22,
              maxWidth: 620,
            }}
          >
            {headline}
          </span>
        </div>

        {/* portrait */}
        {avatarSrc ? (
          <div
            style={{
              position: 'absolute',
              right: 88,
              top: 143,
              display: 'flex',
              width: 344,
              height: 344,
            }}
          >
            <img
              src={avatarSrc}
              width={344}
              height={344}
              style={{
                borderRadius: 344,
                objectFit: 'cover',
                border: '1px solid rgba(237,237,237,0.22)',
                boxShadow: '0 24px 80px rgba(0,0,0,0.55)',
              }}
            />
          </div>
        ) : null}
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Instrument Serif', data: serif, weight: 400, style: 'normal' },
        {
          name: 'Instrument Serif',
          data: serifItalic,
          weight: 400,
          style: 'italic',
        },
        { name: 'Inter', data: sans, weight: 400, style: 'normal' },
      ],
    },
  );
}
