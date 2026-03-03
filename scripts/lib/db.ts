import { neonConfig, Pool } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

// Dynamically import the generated Prisma client
const clientModule = await import('../../packages/db/generated/client.js');
const PrismaClient = clientModule.PrismaClient;

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });

export const prisma = new PrismaClient({ adapter });
