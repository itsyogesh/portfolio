import { database } from '@packages/db';
import { type NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../_lib/auth';

// GET /api/projects — list all projects ordered by position
export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const projects = await database.project.findMany({
    orderBy: { position: 'asc' },
    include: { organization: true },
  });

  return NextResponse.json(projects);
}

// POST /api/projects — create a project
export async function POST(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();

    const project = await database.project.create({
      data: {
        title: body.title,
        slug: body.slug,
        summary: body.summary || null,
        content: body.content || null,
        status: body.status || 'concept',
        category: body.category || null,
        tech: body.tech || [],
        url: body.url || null,
        githubUrl: body.githubUrl || null,
        imageUrl: body.imageUrl || null,
        featured: body.featured ?? false,
        position: body.position ?? 0,
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
        kind: body.kind || null,
        role: body.role || null,
        highlights: body.highlights || [],
        organizationId: body.organizationId || null,
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 400 }
    );
  }
}
