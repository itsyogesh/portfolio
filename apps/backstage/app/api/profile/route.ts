import { database } from '@packages/db';
import { type NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../_lib/auth';

// GET /api/profile — fetch profile with social links
export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const profile = await database.profile.findUnique({
    where: { id: 'owner' },
    include: { socials: { orderBy: { position: 'asc' } } },
  });

  return NextResponse.json(profile);
}

// PUT /api/profile — upsert profile
export async function PUT(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();

    const profile = await database.profile.upsert({
      where: { id: 'owner' },
      create: {
        id: 'owner',
        name: body.name,
        headline: body.headline || null,
        bio: body.bio || null,
        avatarUrl: body.avatarUrl || null,
        location: body.location || null,
        website: body.website || null,
        resumeUrl: body.resumeUrl || null,
        email: body.email || null,
        phone: body.phone || null,
      },
      update: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.headline !== undefined && { headline: body.headline || null }),
        ...(body.bio !== undefined && { bio: body.bio || null }),
        ...(body.avatarUrl !== undefined && {
          avatarUrl: body.avatarUrl || null,
        }),
        ...(body.location !== undefined && {
          location: body.location || null,
        }),
        ...(body.website !== undefined && { website: body.website || null }),
        ...(body.resumeUrl !== undefined && {
          resumeUrl: body.resumeUrl || null,
        }),
        ...(body.email !== undefined && { email: body.email || null }),
        ...(body.phone !== undefined && { phone: body.phone || null }),
      },
      include: { socials: { orderBy: { position: 'asc' } } },
    });

    return NextResponse.json(profile);
  } catch {
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 400 }
    );
  }
}
