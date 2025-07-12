import { config } from 'dotenv';
import { join } from 'path';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// Load environment variables from root directory
config({ path: join(process.cwd(), '../.env') });

async function runMigrations() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  console.log('🗃️ Starting database migration...');
  console.log('📡 Connecting to:', process.env.DATABASE_URL.replace(/:[^:@]*@/, ':***@'));
  
  // Create migration client with Supabase-optimized settings
  const migrationClient = postgres(process.env.DATABASE_URL, {
    max: 1,
    ssl: 'require',
    connect_timeout: 10,
    idle_timeout: 20,
    // Force IPv4 for better compatibility
    family: 4,
  });
  
  const db = drizzle(migrationClient);

  try {
    console.log('🔗 Testing database connection...');
    // Test connection first
    await migrationClient`SELECT 1`;
    console.log('✅ Database connection successful');
    
    console.log('📋 Running migrations...');
    await migrate(db, { 
      migrationsFolder: './src/shared/db/migrations',
    });
    console.log('✅ Migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await migrationClient.end();
  }
}

runMigrations();