import 'dotenv/config';
import { db } from '../shared/db/connection.js';
import { ocrJobs, contacts } from '../shared/db/schema.js';
import { eq } from 'drizzle-orm';

async function testOcrSimple() {
  console.log('🔍 Testing OCR job processing (simple)...');
  
  try {
    // Find a pending OCR job
    const pendingJobs = await db
      .select()
      .from(ocrJobs)
      .where(eq(ocrJobs.status, 'pending'))
      .limit(1);
    
    if (pendingJobs.length === 0) {
      console.log('❌ No pending OCR jobs found');
      return;
    }
    
    const job = pendingJobs[0];
    console.log('✅ Found pending job:', job.id);
    
    // Get the associated contact
    const contact = await db
      .select()
      .from(contacts)
      .where(eq(contacts.id, job.contactId))
      .limit(1);
    
    if (contact.length === 0) {
      console.log('❌ Contact not found for job');
      return;
    }
    
    console.log('✅ Found contact:', contact[0].id, contact[0].businessCardUrl);
    
    // Update job status to processing (simple test)
    const updated = await db
      .update(ocrJobs)
      .set({ 
        status: 'processing',
        startedAt: new Date()
      })
      .where(eq(ocrJobs.id, job.id))
      .returning();
    
    console.log('✅ Updated job status to processing:', updated[0]?.status);
    
    // Simulate OCR processing failure for now (since we need network for Tesseract)
    const mockResult = await db
      .update(ocrJobs)
      .set({ 
        status: 'failed',
        errorMessage: 'OCR processing requires network access - test completed',
        completedAt: new Date()
      })
      .where(eq(ocrJobs.id, job.id))
      .returning();
    
    console.log('✅ Mock OCR completion:', mockResult[0]?.status);
    
    // Update contact
    await db
      .update(contacts)
      .set({ 
        status: 'pending_review',
        fullName: 'Test Contact (OCR Simulated)',
        ocrConfidence: '0.5'
      })
      .where(eq(contacts.id, contact[0].id));
    
    console.log('✅ Updated contact with mock OCR data');
    console.log('🎉 Database operations working correctly!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testOcrSimple();