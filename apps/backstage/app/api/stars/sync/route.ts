import { database } from '@packages/db';
import { NextResponse } from 'next/server';
import { requireAdmin } from '../../_lib/auth';

type GitHubStarredRepo = {
  id: number;
  full_name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  topics: string[];
  owner: {
    avatar_url: string;
  };
};

async function resolveUsername(): Promise<string> {
  if (process.env.GITHUB_USERNAME) return process.env.GITHUB_USERNAME;

  const githubLink = await database.socialLink.findFirst({
    where: { profileId: 'owner', platform: 'github' },
  });
  if (githubLink?.url) {
    const match = githubLink.url.match(/github\.com\/([^/]+)/);
    if (match) return match[1];
  }

  throw new Error(
    'Set GITHUB_USERNAME env var or add a GitHub social link to your profile'
  );
}

async function fetchAllStarredRepos(): Promise<GitHubStarredRepo[]> {
  const username = await resolveUsername();
  const token = process.env.GITHUB_TOKEN;

  const allRepos: GitHubStarredRepo[] = [];
  let page = 1;

  while (true) {
    const url = `https://api.github.com/users/${username}/starred?per_page=100&page=${page}`;
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'personal-docs-backstage',
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(
        `GitHub API error: ${response.status} ${response.statusText}`
      );
    }

    const repos: GitHubStarredRepo[] = await response.json();

    if (repos.length === 0) {
      break;
    }

    allRepos.push(...repos);

    // Check if there are more pages via Link header
    const linkHeader = response.headers.get('Link');
    if (!linkHeader || !linkHeader.includes('rel="next"')) {
      break;
    }

    page++;
  }

  return allRepos;
}

// POST /api/stars/sync — sync starred repos from GitHub
export async function POST() {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const starredRepos = await fetchAllStarredRepos();
    const githubIds = starredRepos.map((r) => r.id);

    let upserted = 0;
    let unmarked = 0;

    // Upsert all starred repos
    for (const repo of starredRepos) {
      await database.starRepo.upsert({
        where: { githubId: repo.id },
        create: {
          githubId: repo.id,
          fullName: repo.full_name,
          htmlUrl: repo.html_url,
          description: repo.description,
          language: repo.language,
          stargazersCount: repo.stargazers_count,
          topics: repo.topics || [],
          avatarUrl: repo.owner.avatar_url,
          isStarred: true,
          unstarredAt: null,
        },
        update: {
          fullName: repo.full_name,
          htmlUrl: repo.html_url,
          description: repo.description,
          language: repo.language,
          stargazersCount: repo.stargazers_count,
          topics: repo.topics || [],
          avatarUrl: repo.owner.avatar_url,
          isStarred: true,
          unstarredAt: null,
        },
      });
      upserted++;
    }

    // Mark repos not in latest data as unstarred
    const result = await database.starRepo.updateMany({
      where: {
        githubId: { notIn: githubIds },
        isStarred: true,
      },
      data: {
        isStarred: false,
        unstarredAt: new Date(),
      },
    });
    unmarked = result.count;

    return NextResponse.json({
      success: true,
      synced: upserted,
      unmarked,
      total: starredRepos.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Sync failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
