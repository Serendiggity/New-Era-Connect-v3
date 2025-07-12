import 'dotenv/config';
import { ocrJobService } from '../features/contacts/ocr-job.service.js';

async function processOcr() {
  console.log('🔍 Processing pending OCR jobs...');
  
  try {
    const result = await ocrJobService.processPendingJobs();
    console.log('✅ OCR processing complete!');
    console.log(`📊 Results: ${result.processed} processed, ${result.failed} failed`);
  } catch (error) {
    console.error('❌ OCR processing failed:', error);
  }
}

processOcr();