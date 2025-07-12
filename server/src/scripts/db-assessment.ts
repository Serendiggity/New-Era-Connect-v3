import { config } from 'dotenv';
import { join } from 'path';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from root directory
const envPath = join(process.cwd(), '../.env');
console.log('Looking for .env at:', envPath);
config({ path: envPath });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function assessDatabase() {
  console.log('🔍 Assessing Supabase database state...\n');
  
  try {
    // Check if we can connect
    const { data: connection, error: connectionError } = await supabase
      .from('information_schema.tables')
      .select('*')
      .limit(1);
    
    if (connectionError) {
      console.error('❌ Connection failed:', connectionError);
      return;
    }
    
    console.log('✅ Successfully connected to Supabase\n');
    
    // Get all user tables (excluding system tables)
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_user_tables');
    
    if (tablesError) {
      // Fallback: try to query information_schema directly
      const { data: fallbackTables, error: fallbackError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .neq('table_name', 'spatial_ref_sys'); // Exclude PostGIS system table
      
      if (fallbackError) {
        console.error('❌ Could not fetch tables:', fallbackError);
        return;
      }
      
      if (fallbackTables && fallbackTables.length > 0) {
        console.log('📊 Existing tables in database:');
        fallbackTables.forEach((table: any) => {
          console.log(`  - ${table.table_name}`);
        });
        console.log(`\n📈 Total tables: ${fallbackTables.length}\n`);
        
        // Check data in each table
        for (const table of fallbackTables) {
          const { count, error } = await supabase
            .from(table.table_name)
            .select('*', { count: 'exact', head: true });
          
          if (!error) {
            console.log(`🗂️  ${table.table_name}: ${count || 0} rows`);
          }
        }
      } else {
        console.log('✨ Database is empty - no user tables found');
      }
    }
    
  } catch (error) {
    console.error('❌ Assessment failed:', error);
  }
}

// Also create a helper function to check if specific tables exist
async function checkBusinessCardTables() {
  console.log('\n🎯 Checking for Business Card Manager tables...');
  
  const expectedTables = [
    'events',
    'contacts', 
    'lead_groups',
    'lead_group_contacts',
    'email_templates',
    'email_campaigns',
    'email_drafts',
    'activity_logs',
    'ocr_jobs'
  ];
  
  for (const tableName of expectedTables) {
    const { data, error } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.log(`❌ ${tableName}: Not found`);
    } else {
      console.log(`✅ ${tableName}: Exists (${data?.length || 0} rows)`);
    }
  }
}

async function main() {
  await assessDatabase();
  await checkBusinessCardTables();
  
  console.log('\n🎯 Assessment complete!');
  console.log('Next steps:');
  console.log('1. If tables exist from previous projects, we\'ll clean them');
  console.log('2. Set up fresh schema for Business Card Manager');
  console.log('3. Run migrations to create all required tables');
}

main().catch(console.error);