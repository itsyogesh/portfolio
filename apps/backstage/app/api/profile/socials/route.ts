import { database } from '@packages/db';
import { type NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../../_lib/auth';

// GET /api/profile/socials — list social links
export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const socials = await database.socialLink.findMany({
    where: { profileId: 'owner' },
    orderBy: { position: 'asc' },
  });

  return NextResponse.json(socials);
}

// POST /api/profile/socials — create a social link
export async function POST(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();

    const social = await database.socialLink.create({
      data: {
        platform: body.platform,
        url: body.url,
        label: body.label || null,
        position: body.position ?? 0,
        profileId: 'owner',
      },
    });

    return NextResponse.json(social, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Failed to create social link' },
      { status: 400 }
    );
  }
}
