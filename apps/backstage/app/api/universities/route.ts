import { type NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../_lib/auth';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

type University = {
  name: string;
  domains: string[];
  web_pages: string[];
  country: string;
  alpha_two_code: string;
  'state-province': string | null;
};

let universities: University[] | null = null;

function loadUniversities(): University[] {
  if (!universities) {
    const dataPath = join(process.cwd(), '..', '..', 'data', 'universities.json');
    universities = JSON.parse(readFileSync(dataPath, 'utf-8'));
  }
  return universities!;
}

// GET /api/universities?q=search+term&limit=10
export async function GET(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const query = request.nextUrl.searchParams.get('q')?.toLowerCase().trim();
  const limit = Math.min(
    Number(request.nextUrl.searchParams.get('limit')) || 10,
    25
  );

  if (!query || query.length < 2) {
    return NextResponse.json([]);
  }

  const data = loadUniversities();
  const results: { name: string; country: string; url: string | null; domain: string | null }[] = [];

  for (const uni of data) {
    if (results.length >= limit) break;
    if (uni.name.toLowerCase().includes(query)) {
      results.push({
        name: uni.name,
        country: uni.country,
        url: uni.web_pages?.[0] ?? null,
        domain: uni.domains?.[0] ?? null,
      });
    }
  }

  return NextResponse.json(results);
}
