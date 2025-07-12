import { config } from 'dotenv';
import { join } from 'path';
import postgres from 'postgres';

// Load environment variables from root directory
const envPath = join(process.cwd(), '../.env');
config({ path: envPath });

const databaseUrl = process.env.DATABASE_URL!;

if (!databaseUrl) {
  console.error('Missing DATABASE_URL environment variable');
  process.exit(1);
}

async function nuclearCleanup() {
  console.log('💥 Nuclear database cleanup - removing ALL user tables...\n');
  
  const sql = postgres(databaseUrl, { ssl: 'require' });
  
  try {
    // First, get all user tables
    const tables = await sql`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename != 'spatial_ref_sys'
    `;
    
    console.log('📋 Found tables:', tables.map(t => t.tablename));
    
    if (tables.length === 0) {
      console.log('✨ Database is already clean!');
      return;
    }
    
    // Drop all tables with CASCADE
    for (const table of tables) {
      console.log(`🗑️  Dropping ${table.tablename}...`);
      try {
        await sql.unsafe(`DROP TABLE IF EXISTS "${table.tablename}" CASCADE`);
        console.log(`   ✅ Dropped ${table.tablename}`);
      } catch (error) {
        console.log(`   ❌ Failed to drop ${table.tablename}:`, error);
      }
    }
    
    // Verify cleanup
    const remainingTables = await sql`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename != 'spatial_ref_sys'
    `;
    
    if (remainingTables.length === 0) {
      console.log('\n🎉 SUCCESS: Database is completely clean!');
    } else {
      console.log('\n⚠️  Some tables remain:', remainingTables.map(t => t.tablename));
    }
    
  } catch (error) {
    console.error('❌ Nuclear cleanup failed:', error);
  } finally {
    await sql.end();
  }
}

async function main() {
  console.log('⚠️  NUCLEAR WARNING: This will DELETE ALL TABLES in your database!');
  console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
  
  // Wait 5 seconds to allow cancellation
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  await nuclearCleanup();
}

main().catch(console.error);