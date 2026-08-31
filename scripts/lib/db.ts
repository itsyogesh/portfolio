import { neonConfig, Pool } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

// Dynamically import the generated Prisma client
const clientModule = await import('../../packages/db/generated/client.js');
const PrismaClient = clientModule.PrismaClient;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not configured');
}

const adapter = new PrismaNeon({ connectionString });

export const prisma = new PrismaClient({ adapter });
