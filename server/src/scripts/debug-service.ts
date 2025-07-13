import { loadEnvironment } from '../shared/utils/env-loader.js';

// Load environment variables safely
loadEnvironment();

import { contactsService } from '../features/contacts/contacts.service.js';

async function debugService() {
  console.log('🔍 Testing contacts service with different filters...');
  
  try {
    // Test 1: Get all contacts (no filters)
    console.log('\n📋 Test 1: All contacts (no filters)');
    const allContacts = await contactsService.findAll({});
    console.log(`Found ${allContacts.length} contacts total`);
    
    allContacts.slice(0, 3).forEach(contact => {
      console.log(`  ID ${contact.id}: "${contact.full_name}" (status: ${contact.status})`);
    });
    
    // Test 2: Only processing status
    console.log('\n📋 Test 2: Only processing status');
    const processingContacts = await contactsService.findAll({ status: 'processing' });
    console.log(`Found ${processingContacts.length} processing contacts`);
    
    processingContacts.slice(0, 3).forEach(contact => {
      console.log(`  ID ${contact.id}: "${contact.full_name}" (status: ${contact.status})`);
    });
    
    // Test 3: Only completed status
    console.log('\n📋 Test 3: Only completed status');
    const completedContacts = await contactsService.findAll({ status: 'completed' });
    console.log(`Found ${completedContacts.length} completed contacts`);
    
    completedContacts.slice(0, 3).forEach(contact => {
      console.log(`  ID ${contact.id}: "${contact.full_name}" (status: ${contact.status})`);
    });
    
    // Test 4: Check a specific contact by ID
    console.log('\n📋 Test 4: Get contact ID 3 specifically');
    try {
      const contact3 = await contactsService.findById(3);
      console.log(`Contact 3: "${contact3.full_name}" (should be "Ibrahim Kone")`);
    } catch (error) {
      console.log(`Error getting contact 3: ${error}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

debugService().catch(console.error);