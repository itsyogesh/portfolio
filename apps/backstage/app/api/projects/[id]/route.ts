import { database } from '@packages/db';
import { type NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../../_lib/auth';

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/projects/[id] — get a single project
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const { error } = await requireAdmin();
  if (error) return error;

  const project = await database.project.findUnique({
    where: { id },
    include: { organization: true },
  });

  if (!project) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(project);
}

// PATCH /api/projects/[id] — update a project
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();

    const project = await database.project.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.slug !== undefined && { slug: body.slug }),
        ...(body.summary !== undefined && { summary: body.summary || null }),
        ...(body.content !== undefined && { content: body.content || null }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.category !== undefined && { category: body.category || null }),
        ...(body.tech !== undefined && { tech: body.tech }),
        ...(body.url !== undefined && { url: body.url || null }),
        ...(body.githubUrl !== undefined && {
          githubUrl: body.githubUrl || null,
        }),
        ...(body.imageUrl !== undefined && {
          imageUrl: body.imageUrl || null,
        }),
        ...(body.featured !== undefined && { featured: body.featured }),
        ...(body.position !== undefined && { position: body.position }),
        ...(body.startDate !== undefined && {
          startDate: body.startDate ? new Date(body.startDate) : null,
        }),
        ...(body.endDate !== undefined && {
          endDate: body.endDate ? new Date(body.endDate) : null,
        }),
        ...(body.kind !== undefined && { kind: body.kind || null }),
        ...(body.role !== undefined && { role: body.role || null }),
        ...(body.highlights !== undefined && { highlights: body.highlights }),
        ...(body.organizationId !== undefined && {
          organizationId: body.organizationId || null,
        }),
      },
    });

    return NextResponse.json(project);
  } catch {
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 400 }
    );
  }
}

// DELETE /api/projects/[id] — delete a project
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    await database.project.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 400 }
    );
  }
}
