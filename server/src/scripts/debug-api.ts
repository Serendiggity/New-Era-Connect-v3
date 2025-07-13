import { loadEnvironment } from '../shared/utils/env-loader.js';

// Load environment variables safely
loadEnvironment();

import { contactsService } from '../features/contacts/contacts.service.js';

async function debugApi() {
  console.log('🔍 Testing contacts API...');
  
  try {
    // Get contacts using the service (same as API)
    const contacts = await contactsService.findAll({});
    
    console.log(`📋 Found ${contacts.length} contacts`);
    console.log('\n🔍 Sample contacts from API:');
    
    contacts.slice(0, 5).forEach(contact => {
      console.log(`  ID: ${contact.id}`);
      console.log(`    full_name: "${contact.full_name}"`);
      console.log(`    email: "${contact.email}"`);
      console.log(`    company: "${contact.company}"`);
      console.log(`    title: "${contact.title}"`);
      console.log(`    phone: "${contact.phone}"`);
      console.log(`    ocr_confidence: "${contact.ocr_confidence}"`);
      console.log(`    user_modified_fields: ${JSON.stringify(contact.user_modified_fields)}`);
      console.log(`    status: "${contact.status}"`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

debugApi().catch(console.error);