import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Create the postgres client with Supabase-optimized settings
const client = postgres(process.env.DATABASE_URL, {
  max: 10,
  ssl: 'require',
  idle_timeout: 20,
  connect_timeout: 10,
  // Force IPv4 for better compatibility
  family: 4,
});

// Create and export the drizzle instance
export const db = drizzle(client, { schema });

// Export types for use throughout the application
export type Database = typeof db;
export { schema };

// Utility function to close the database connection (for graceful shutdown)
export const closeDatabase = async () => {
  await client.end();
};