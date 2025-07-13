import { loadEnvironment } from '../shared/utils/env-loader.js';

// Load environment variables safely
loadEnvironment();

import { db } from '../shared/db/connection.js';
import { contacts } from '../shared/db/schema.js';

async function debugDatabase() {
  console.log('🔍 Checking raw database data...');
  
  try {
    // Get contacts directly from database (no service layer)
    const rawContacts = await db.select().from(contacts).limit(5);
    
    console.log(`📋 Found ${rawContacts.length} raw contacts from database`);
    console.log('\n🔍 Raw database contacts (camelCase):');
    
    rawContacts.forEach(contact => {
      console.log(`  ID: ${contact.id}`);
      console.log(`    fullName (camelCase): "${contact.fullName}"`);
      console.log(`    email: "${contact.email}"`);
      console.log(`    company: "${contact.company}"`);
      console.log(`    title: "${contact.title}"`);
      console.log(`    phone: "${contact.phone}"`);
      console.log(`    ocrConfidence: "${contact.ocrConfidence}"`);
      console.log(`    userModifiedFields: ${JSON.stringify(contact.userModifiedFields)}"`);
      console.log(`    status: "${contact.status}"`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

debugDatabase().catch(console.error);