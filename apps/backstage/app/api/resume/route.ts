import { database } from '@packages/db';
import { NextResponse } from 'next/server';
import { requireAdmin } from '../_lib/auth';

// GET /api/resume — export JSON Resume v1.0.0
export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const [
    profile,
    organizations,
    education,
    accolades,
    writings,
    stackCategories,
    projects,
    languages,
  ] = await Promise.all([
    database.profile.findUnique({
      where: { id: 'owner' },
      include: { socials: { orderBy: { position: 'asc' } } },
    }),
    database.organization.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        workExperiences: { orderBy: { startDate: 'desc' } },
      },
    }),
    database.education.findMany({ orderBy: { position: 'asc' } }),
    database.accolade.findMany({ orderBy: { position: 'asc' } }),
    database.externalWriting.findMany({ orderBy: { position: 'asc' } }),
    database.stackCategory.findMany({
      orderBy: { position: 'asc' },
      include: { items: { orderBy: { position: 'asc' } } },
    }),
    database.project.findMany({
      orderBy: { position: 'asc' },
      include: { organization: true },
    }),
    database.language.findMany({ orderBy: { position: 'asc' } }),
  ]);

  const formatDate = (date: Date | null | undefined) =>
    date ? date.toISOString().split('T')[0] : undefined;

  // basics
  const basics: Record<string, unknown> = {
    name: profile?.name,
    label: profile?.headline ?? undefined,
    image: profile?.avatarUrl ?? undefined,
    email: profile?.email ?? undefined,
    phone: profile?.phone ?? undefined,
    url: profile?.website ?? undefined,
    summary: profile?.bio ?? undefined,
    location: profile?.location
      ? { address: profile.location }
      : undefined,
    profiles: profile?.socials.map((s) => ({
      network: s.platform,
      url: s.url,
      username: s.label ?? undefined,
    })),
  };

  // work — flatten org + work experiences
  const work = organizations.flatMap((org) =>
    org.workExperiences.map((we) => ({
      name: org.name,
      position: we.title,
      url: org.website ?? undefined,
      startDate: formatDate(we.startDate),
      endDate: formatDate(we.endDate),
      summary: we.description ?? undefined,
      highlights: we.highlights.length > 0 ? we.highlights : undefined,
    }))
  );

  // education
  const educationSection = education.map((e) => ({
    institution: e.institution,
    url: e.url ?? undefined,
    area: e.field ?? undefined,
    studyType: e.degree ?? undefined,
    startDate: formatDate(e.startDate),
    endDate: formatDate(e.endDate),
    score: e.gpa ?? undefined,
    courses: e.courses.length > 0 ? e.courses : undefined,
  }));

  // awards (type=award or hackathon)
  const awards = accolades
    .filter((a) => a.type === 'award' || a.type === 'hackathon')
    .map((a) => ({
      title: a.title,
      date: formatDate(a.date),
      awarder: a.issuer ?? undefined,
      summary: a.description ?? undefined,
    }));

  // certificates (type=certification)
  const certificates = accolades
    .filter((a) => a.type === 'certification')
    .map((a) => ({
      name: a.title,
      date: formatDate(a.date),
      issuer: a.issuer ?? undefined,
      url: a.url ?? undefined,
    }));

  // publications
  const publications = writings.map((w) => ({
    name: w.title,
    publisher: w.source ?? undefined,
    releaseDate: formatDate(w.publishedAt),
    url: w.url,
    summary: w.summary ?? undefined,
  }));

  // skills
  const skills = stackCategories.map((cat) => ({
    name: cat.name,
    level: cat.items.find((i) => i.level)?.level ?? undefined,
    keywords: cat.items.map((i) => i.name),
  }));

  // projects
  const projectsSection = projects.map((p) => ({
    name: p.title,
    description: p.summary ?? undefined,
    highlights: p.highlights.length > 0 ? p.highlights : undefined,
    keywords: p.tech.length > 0 ? p.tech : undefined,
    startDate: formatDate(p.startDate),
    endDate: formatDate(p.endDate),
    url: p.url ?? undefined,
    roles: p.role ? [p.role] : undefined,
    entity: p.organization?.name ?? undefined,
    type: p.kind ?? undefined,
  }));

  // languages
  const languagesSection = languages.map((l) => ({
    language: l.name,
    fluency: l.fluency ?? undefined,
  }));

  const resume = {
    $schema: 'https://raw.githubusercontent.com/jsonresume/resume-schema/v1.0.0/schema.json',
    basics,
    work,
    education: educationSection,
    ...(awards.length > 0 && { awards }),
    ...(certificates.length > 0 && { certificates }),
    ...(publications.length > 0 && { publications }),
    skills,
    ...(projectsSection.length > 0 && { projects: projectsSection }),
    ...(languagesSection.length > 0 && { languages: languagesSection }),
    meta: {
      canonical: profile?.website ?? undefined,
      version: 'v1.0.0',
      lastModified: new Date().toISOString().split('T')[0],
    },
  };

  return NextResponse.json(resume);
}
