import { loadEnvironment } from '../shared/utils/env-loader.js';

// Load environment variables safely
loadEnvironment();

import { db } from '../shared/db/connection.js';
import { contacts } from '../shared/db/schema.js';
import { eq } from 'drizzle-orm';
import { ocrJobService } from '../features/contacts/ocr-job.service.js';

async function testOcrFlow() {
  console.log('🔍 Testing OCR processing flow...');
  
  try {
    // Find a contact with "Processing..." name and a business card URL
    const processingContacts = await db
      .select()
      .from(contacts)
      .where(eq(contacts.fullName, 'Processing...'))
      .limit(1);
    
    if (processingContacts.length === 0) {
      console.log('❌ No contacts with "Processing..." name found to test');
      return;
    }
    
    const contact = processingContacts[0];
    console.log(`🎯 Testing contact ID ${contact.id}:`);
    console.log(`  Name: "${contact.fullName}"`);
    console.log(`  Status: ${contact.status}`);
    console.log(`  Business card URL: ${contact.businessCardUrl}`);
    
    if (!contact.businessCardUrl) {
      console.log('❌ Contact has no business card URL to process');
      return;
    }
    
    console.log('\n🚀 Creating and processing OCR job...');
    
    // Create OCR job
    const ocrJob = await ocrJobService.createJob({
      contact_id: contact.id,
      business_card_url: contact.businessCardUrl,
    });
    
    console.log(`✅ OCR job created with ID: ${ocrJob.id}`);
    
    // Process the job (this should update the contact name)
    console.log('🔄 Processing OCR job...');
    const result = await ocrJobService.processJob(ocrJob.id);
    
    console.log('✅ OCR job processing completed');
    console.log('Result:', JSON.stringify(result, null, 2));
    
    // Check if contact was updated
    console.log('\n🔍 Checking updated contact...');
    const updatedContact = await db
      .select()
      .from(contacts)
      .where(eq(contacts.id, contact.id))
      .limit(1);
    
    if (updatedContact.length > 0) {
      const updated = updatedContact[0];
      console.log(`Updated contact:`)
      console.log(`  Name: "${updated.fullName}" (was: "${contact.fullName}")`);
      console.log(`  Status: ${updated.status} (was: ${contact.status})`);
      console.log(`  OCR Confidence: ${updated.ocrConfidence}`);
      console.log(`  User Modified Fields: ${JSON.stringify(updated.userModifiedFields)}`);
      
      if (updated.fullName === 'Processing...') {
        console.log('❌ OCR processing failed to update the contact name!');
      } else {
        console.log('✅ OCR processing successfully updated the contact name!');
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing OCR flow:', error);
    throw error;
  }
}

testOcrFlow().catch(console.error);