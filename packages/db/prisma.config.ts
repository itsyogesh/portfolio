import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  // Migrations should use Neon's direct connection when available; the app
  // can continue using the pooled/serverless DATABASE_URL at runtime.
  datasource: { url: process.env.DIRECT_URL || env('DATABASE_URL') },
});
