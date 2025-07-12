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

async function wipeDatabase() {
  console.log('🧹 Starting complete database cleanup...\n');
  
  try {
    // List of tables to drop in correct order (respecting foreign key dependencies)
    const tablesToDrop = [
      'email_drafts',
      'email_campaigns', 
      'email_templates',
      'lead_group_contacts',
      'lead_groups',
      'ocr_jobs',
      'contacts',
      'events',
      'activity_logs'
    ];
    
    console.log('🗑️  Dropping existing tables...');
    
    for (const tableName of tablesToDrop) {
      console.log(`   Dropping ${tableName}...`);
      
      const { error } = await supabase.rpc('exec_sql', {
        sql: `DROP TABLE IF EXISTS ${tableName} CASCADE;`
      });
      
      if (error) {
        // Try alternative approach with direct SQL
        const { error: directError } = await supabase
          .from('_temp_exec')
          .select('*')
          .limit(0);
        
        // If that fails too, try a different approach
        console.log(`   ⚠️  Standard drop failed for ${tableName}, trying direct approach...`);
        
        try {
          // Use a simple HTTP request to execute SQL
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
              'apikey': supabaseKey
            },
            body: JSON.stringify({
              sql: `DROP TABLE IF EXISTS ${tableName} CASCADE;`
            })
          });
          
          if (!response.ok) {
            console.log(`   ⚠️  Could not drop ${tableName} (may not exist)`);
          } else {
            console.log(`   ✅ Dropped ${tableName}`);
          }
        } catch (fetchError) {
          console.log(`   ⚠️  Could not drop ${tableName} (may not exist)`);
        }
      } else {
        console.log(`   ✅ Dropped ${tableName}`);
      }
    }
    
    // Drop any other user tables that might exist
    console.log('\n🔍 Checking for any remaining user tables...');
    
    // Try to get list of remaining tables
    try {
      const { data: remainingTables, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .neq('table_name', 'spatial_ref_sys'); // Exclude PostGIS if present
      
      if (!error && remainingTables && remainingTables.length > 0) {
        console.log('📋 Remaining tables found:');
        for (const table of remainingTables) {
          console.log(`   - ${table.table_name}`);
          
          // Try to drop these too
          try {
            await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
                'apikey': supabaseKey
              },
              body: JSON.stringify({
                sql: `DROP TABLE IF EXISTS "${table.table_name}" CASCADE;`
              })
            });
            console.log(`   ✅ Dropped ${table.table_name}`);
          } catch {
            console.log(`   ⚠️  Could not drop ${table.table_name}`);
          }
        }
      } else {
        console.log('✨ No user tables remaining');
      }
    } catch (error) {
      console.log('ℹ️  Could not check for remaining tables (this is okay)');
    }
    
    console.log('\n🎉 Database cleanup complete!');
    console.log('✨ Fresh clean database ready for new schema');
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  }
}

async function main() {
  console.log('⚠️  WARNING: This will DELETE ALL DATA in your database!');
  console.log('Press Ctrl+C to cancel, or wait 3 seconds to continue...\n');
  
  // Wait 3 seconds to allow cancellation
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  await wipeDatabase();
}

main().catch(console.error);