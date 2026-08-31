import { neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import ws from 'ws';
import { PrismaClient } from '../generated/client';

neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not configured');
}

const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function backfillSlugs() {
  const orgs = await prisma.organization.findMany({
    where: { slug: '' },
  });

  if (orgs.length === 0) {
    console.log('No organizations need slug backfill.');
    return;
  }

  console.log(`Backfilling slugs for ${orgs.length} organizations...`);

  for (const org of orgs) {
    const slug = slugify(org.name);

    // Handle duplicates by appending a suffix
    let suffix = 0;
    let candidate = slug;
    while (await prisma.organization.findFirst({ where: { slug: candidate, id: { not: org.id } } })) {
      suffix++;
      candidate = `${slug}-${suffix}`;
    }

    await prisma.organization.update({
      where: { id: org.id },
      data: { slug: candidate },
    });

    console.log(`  ${org.name} → ${candidate}`);
  }

  console.log('Done.');
}

backfillSlugs()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
