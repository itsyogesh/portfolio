import 'dotenv/config';
import { prisma } from './lib/db.js';

type GitHubRepo = {
  id: number;
  full_name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  topics: string[];
  owner: { avatar_url: string };
};

async function getUsername(): Promise<string> {
  // 1. Check env var
  if (process.env.GITHUB_USERNAME) return process.env.GITHUB_USERNAME;

  // 2. Check Profile social links
  const githubLink = await prisma.socialLink.findFirst({
    where: { profileId: 'owner', platform: 'github' },
  });
  if (githubLink?.url) {
    const match = githubLink.url.match(/github\.com\/([^/]+)/);
    if (match) return match[1];
  }

  console.error('Error: Set GITHUB_USERNAME env var or add a GitHub social link to your profile.');
  process.exit(1);
}

async function fetchAllStarred(username: string): Promise<GitHubRepo[]> {
  const allRepos: GitHubRepo[] = [];
  let page = 1;
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `token ${process.env.GITHUB_TOKEN}`;
  }

  console.log(`Fetching starred repos for ${username}...`);
  if (!process.env.GITHUB_TOKEN) {
    console.log('  (Tip: Set GITHUB_TOKEN for higher rate limits)');
  }

  while (true) {
    const url = `https://api.github.com/users/${username}/starred?per_page=100&page=${page}`;
    const res = await fetch(url, { headers });

    if (!res.ok) {
      if (res.status === 403) {
        console.error(`Rate limited. Fetched ${allRepos.length} repos so far.`);
        break;
      }
      throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
    }

    const repos: GitHubRepo[] = await res.json();
    if (repos.length === 0) break;

    allRepos.push(...repos);
    console.log(`  Page ${page}: ${repos.length} repos (total: ${allRepos.length})`);
    page++;
  }

  return allRepos;
}

async function main() {
  const username = await getUsername();
  const repos = await fetchAllStarred(username);

  console.log(`\nSyncing ${repos.length} starred repos to database...`);

  // Track which githubIds we see in this sync
  const seenGithubIds = new Set<number>();

  let created = 0;
  let updated = 0;

  for (const repo of repos) {
    seenGithubIds.add(repo.id);

    const existing = await prisma.starRepo.findUnique({
      where: { githubId: repo.id },
    });

    if (existing) {
      await prisma.starRepo.update({
        where: { githubId: repo.id },
        data: {
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
      updated++;
    } else {
      await prisma.starRepo.create({
        data: {
          githubId: repo.id,
          fullName: repo.full_name,
          htmlUrl: repo.html_url,
          description: repo.description,
          language: repo.language,
          stargazersCount: repo.stargazers_count,
          topics: repo.topics || [],
          avatarUrl: repo.owner.avatar_url,
          isStarred: true,
        },
      });
      created++;
    }
  }

  // Soft-cleanup: mark repos no longer starred
  const allDbRepos = await prisma.starRepo.findMany({
    where: { isStarred: true },
    select: { id: true, githubId: true },
  });

  let unstarred = 0;
  for (const dbRepo of allDbRepos) {
    if (!seenGithubIds.has(dbRepo.githubId)) {
      await prisma.starRepo.update({
        where: { id: dbRepo.id },
        data: { isStarred: false, unstarredAt: new Date() },
      });
      unstarred++;
    }
  }

  console.log(`\nSync complete!`);
  console.log(`  Created: ${created}`);
  console.log(`  Updated: ${updated}`);
  console.log(`  Unstarred: ${unstarred}`);
}

main()
  .catch((e) => {
    console.error('Sync failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
