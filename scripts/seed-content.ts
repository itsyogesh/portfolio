import 'dotenv/config';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { prisma } from './lib/db.js';

const contentDir = join(import.meta.dirname, '..', 'content');

// ─── Parse MDX frontmatter ──────────────────────────────────────────

function parseFrontmatter(raw: string): { frontmatter: Record<string, unknown>; content: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { frontmatter: {}, content: raw };

  const frontmatter: Record<string, unknown> = {};
  for (const line of match[1].split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    let value: string | unknown = line.slice(colonIdx + 1).trim();

    // Remove quotes
    if (typeof value === 'string' && value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }

    // Parse arrays
    if (typeof value === 'string' && value.startsWith('[')) {
      try {
        value = JSON.parse(value.replace(/'/g, '"'));
      } catch { /* keep as string */ }
    }

    // Parse booleans
    if (value === 'true') value = true;
    if (value === 'false') value = false;

    // Parse numbers
    if (typeof value === 'string' && /^\d+$/.test(value)) {
      value = Number.parseInt(value, 10);
    }

    frontmatter[key] = value;
  }

  return { frontmatter, content: match[2].trim() };
}

// ─── Seed Profile + Social Links ─────────────────────────────────────

async function seedProfile() {
  console.log('Seeding profile...');

  const bio = `I dropped out of engineering college in 2013 and started building software. Since then, I've shipped products across fintech, Web3, EV infrastructure, e-commerce, and developer tools.

My first real venture was Unstudious, an EdTech startup tackling book piracy in India. Matrix Partners and Tracxn noticed. That was enough validation to keep going.

I spent two years at Paytm (seller dashboard backend, then growth engineering), four years at Pei (a payment fintech), and a stint at Flex post-acquisition before going fully independent.

Today I run Droidsize Technologies, a product studio building SaaS and AI tools. I'm also building Chargespot (EV charging infrastructure through Charge23 Labs) and Relaycode (Polkadot developer tooling funded by the Web3 Foundation).

Since late 2025, I've been building almost everything with AI agents. Claude Code changed how I work. I ship faster now than at any point in my career.`;

  await prisma.profile.upsert({
    where: { id: 'owner' },
    update: {
      name: 'Yogesh Kumar',
      headline: 'Full-stack builder. 12+ years shipping products.',
      bio,
      website: 'https://itsyogesh.fyi',
    },
    create: {
      id: 'owner',
      name: 'Yogesh Kumar',
      headline: 'Full-stack builder. 12+ years shipping products.',
      bio,
      website: 'https://itsyogesh.fyi',
    },
  });

  const socials = [
    { platform: 'github', url: 'https://github.com/itsyogesh', label: 'GitHub', position: 0 },
    { platform: 'twitter', url: 'https://twitter.com/itsyogesh18', label: 'Twitter', position: 1 },
    { platform: 'linkedin', url: 'https://linkedin.com/in/itsyogesh', label: 'LinkedIn', position: 2 },
  ];

  for (const social of socials) {
    const existing = await prisma.socialLink.findFirst({
      where: { profileId: 'owner', platform: social.platform },
    });
    if (existing) {
      await prisma.socialLink.update({
        where: { id: existing.id },
        data: social,
      });
    } else {
      await prisma.socialLink.create({
        data: { ...social, profileId: 'owner' },
      });
    }
  }

  console.log('  Profile + 3 social links seeded.');
}

// ─── Seed Projects ───────────────────────────────────────────────────

async function seedProjects() {
  console.log('Seeding projects...');

  const projectsDir = join(contentDir, 'projects');
  const files = readdirSync(projectsDir).filter((f) => f.endsWith('.mdx'));

  let count = 0;
  for (const file of files) {
    const raw = readFileSync(join(projectsDir, file), 'utf-8');
    const { frontmatter, content } = parseFrontmatter(raw);
    const slug = file.replace('.mdx', '');

    await prisma.project.upsert({
      where: { slug },
      update: {
        title: frontmatter.title as string,
        summary: frontmatter.description as string,
        content,
        status: (frontmatter.status as string) || 'concept',
        category: frontmatter.category as string,
        tech: (frontmatter.tech as string[]) || [],
        url: frontmatter.url as string | undefined,
        githubUrl: frontmatter.github as string | undefined,
        featured: (frontmatter.featured as boolean) ?? false,
        position: (frontmatter.order as number) ?? 99,
        startDate: frontmatter.date ? new Date(frontmatter.date as string) : undefined,
      },
      create: {
        slug,
        title: frontmatter.title as string,
        summary: frontmatter.description as string,
        content,
        status: (frontmatter.status as string) || 'concept',
        category: frontmatter.category as string,
        tech: (frontmatter.tech as string[]) || [],
        url: frontmatter.url as string | undefined,
        githubUrl: frontmatter.github as string | undefined,
        featured: (frontmatter.featured as boolean) ?? false,
        position: (frontmatter.order as number) ?? 99,
        startDate: frontmatter.date ? new Date(frontmatter.date as string) : undefined,
      },
    });
    count++;
  }

  console.log(`  ${count} projects seeded.`);
}

// ─── Seed Stack ──────────────────────────────────────────────────────

async function seedStack() {
  console.log('Seeding stack...');

  const stackPath = join(contentDir, 'pages', 'stack.json');
  const stackData = JSON.parse(readFileSync(stackPath, 'utf-8'));

  let categoryCount = 0;
  let itemCount = 0;

  for (let ci = 0; ci < stackData.categories.length; ci++) {
    const cat = stackData.categories[ci];

    // Find or create category by name
    let category = await prisma.stackCategory.findFirst({
      where: { name: cat.name },
    });

    if (category) {
      await prisma.stackCategory.update({
        where: { id: category.id },
        data: { position: ci },
      });
    } else {
      category = await prisma.stackCategory.create({
        data: { name: cat.name, position: ci },
      });
    }
    categoryCount++;

    for (let ii = 0; ii < cat.items.length; ii++) {
      const item = cat.items[ii];

      await prisma.stackItem.upsert({
        where: {
          categoryId_name: {
            categoryId: category.id,
            name: item.name,
          },
        },
        update: {
          description: item.description,
          position: ii,
        },
        create: {
          name: item.name,
          description: item.description,
          position: ii,
          categoryId: category.id,
        },
      });
      itemCount++;
    }
  }

  console.log(`  ${categoryCount} categories, ${itemCount} items seeded.`);
}

// ─── Seed Timeline ───────────────────────────────────────────────────

async function seedTimeline() {
  console.log('Seeding timeline...');

  const timelinePath = join(contentDir, 'pages', 'timeline.json');
  const entries = JSON.parse(readFileSync(timelinePath, 'utf-8'));

  let count = 0;
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];

    await prisma.timelineEntry.upsert({
      where: {
        year_title: {
          year: entry.year,
          title: entry.title,
        },
      },
      update: {
        description: entry.description,
        position: i,
      },
      create: {
        year: entry.year,
        title: entry.title,
        description: entry.description,
        position: i,
      },
    });
    count++;
  }

  console.log(`  ${count} timeline entries seeded.`);
}

// ─── Main ────────────────────────────────────────────────────────────

async function main() {
  console.log('Starting content seed...\n');

  await seedProfile();
  await seedProjects();
  await seedStack();
  await seedTimeline();

  console.log('\nContent seed complete!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
