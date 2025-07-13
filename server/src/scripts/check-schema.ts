import { config } from 'dotenv';
import { join } from 'path';
import postgres from 'postgres';

// Load environment variables
config({ path: join(process.cwd(), '../.env') });

async function checkSchema() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  console.log('🔍 Checking database schema...');
  
  const client = postgres(process.env.DATABASE_URL, {
    max: 1,
    ssl: 'require',
    connect_timeout: 10,
    idle_timeout: 20,
  });
  
  try {
    // Check table schema
    const columns = await client`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'contacts' 
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `;
    
    console.log('📋 Current contacts table columns:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    const hasUserModifiedFields = columns.some(col => col.column_name === 'user_modified_fields');
    console.log(`\n✅ user_modified_fields column exists: ${hasUserModifiedFields}`);
    
    // Check sample contact data
    console.log('\n🔍 Checking sample contact data...');
    const contacts = await client`
      SELECT id, full_name, email, company, title, ocr_confidence, user_modified_fields, status
      FROM contacts 
      ORDER BY id 
      LIMIT 5
    `;
    
    console.log('Sample contacts:');
    contacts.forEach(contact => {
      console.log(`  ID: ${contact.id}`);
      console.log(`    Name: "${contact.full_name}"`);
      console.log(`    Email: "${contact.email}"`);
      console.log(`    Company: "${contact.company}"`);
      console.log(`    Title: "${contact.title}"`);
      console.log(`    OCR Confidence: ${contact.ocr_confidence}`);
      console.log(`    User Modified: ${JSON.stringify(contact.user_modified_fields)}`);
      console.log(`    Status: ${contact.status}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.end();
  }
}

checkSchema().catch(console.error);