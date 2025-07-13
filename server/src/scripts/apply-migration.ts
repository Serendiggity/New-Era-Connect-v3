import { config } from 'dotenv';
import { join } from 'path';
import postgres from 'postgres';

// Load environment variables
config({ path: join(process.cwd(), '../.env') });

async function applyMigration() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  console.log('🔧 Applying missing migration manually...');
  
  const client = postgres(process.env.DATABASE_URL, {
    max: 1,
    ssl: 'require',
    connect_timeout: 10,
    idle_timeout: 20,
  });
  
  try {
    // Add the missing column
    console.log('➕ Adding user_modified_fields column...');
    await client`
      ALTER TABLE "contacts" 
      ADD COLUMN "user_modified_fields" jsonb DEFAULT '{}'
    `;
    
    console.log('📄 Adding column comment...');
    await client`
      COMMENT ON COLUMN "contacts"."user_modified_fields" 
      IS 'Tracks which fields have been manually modified by users to prevent OCR overwrites. Format: {"full_name": true, "email": true, ...}'
    `;
    
    console.log('✅ Migration applied successfully!');
    
    // Verify the column was added
    console.log('\n🔍 Verifying migration...');
    const columns = await client`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns 
      WHERE table_name = 'contacts' 
      AND column_name = 'user_modified_fields'
    `;
    
    if (columns.length > 0) {
      console.log('✅ user_modified_fields column confirmed:');
      console.log(`  Type: ${columns[0].data_type}`);
      console.log(`  Default: ${columns[0].column_default}`);
    } else {
      console.log('❌ Column not found after migration!');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

applyMigration().catch(console.error);