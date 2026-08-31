import { database } from '@packages/db';
import { type NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../_lib/auth';

// GET /api/organizations — list all orgs with work experiences
export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const organizations = await database.organization.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      workExperiences: {
        orderBy: { position: 'asc' },
      },
    },
  });

  return NextResponse.json(organizations);
}

// POST /api/organizations — create an organization
export async function POST(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();

    const slug =
      body.slug ||
      body.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

    const organization = await database.organization.create({
      data: {
        name: body.name,
        slug,
        description: body.description || null,
        logoUrl: body.logoUrl || null,
        website: body.website || null,
        location: body.location || null,
        type: body.type || 'company',
        industry: body.industry || null,
      },
    });

    return NextResponse.json(organization, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Failed to create organization' },
      { status: 400 }
    );
  }
}
