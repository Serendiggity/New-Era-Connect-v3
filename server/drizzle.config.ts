import type { Config } from 'drizzle-kit';
import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables from root directory
config({ path: join(process.cwd(), '../.env') });

export default {
  schema: './src/shared/db/schema.ts',
  out: './src/shared/db/migrations',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
} satisfies Config;