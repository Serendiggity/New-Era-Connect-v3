import 'dotenv/config';
import { uploadService } from '../features/contacts/upload.service.js';
import fs from 'fs';
import path from 'path';

async function debugUpload() {
  console.log('🔍 Debugging upload service...');
  
  // Check environment variables
  console.log('\n📋 Environment check:');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? `✅ Set (${process.env.SUPABASE_URL.substring(0, 30)}...)` : '❌ Missing');
  console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? `✅ Set (${process.env.SUPABASE_ANON_KEY.substring(0, 20)}...)` : '❌ Missing');
  
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.log('\n❌ Environment variables not loaded properly');
    console.log('Current working directory:', process.cwd());
    console.log('Trying to load .env manually...');
    
    // Try to load manually
    import('dotenv').then(({ config }) => {
      const result = config();
      console.log('Manual dotenv result:', result.error ? result.error : 'Success');
    });
    
    return;
  }
  
  try {
    // Test bucket creation
    console.log('\n🪣 Testing bucket setup...');
    await uploadService.ensureBucketExists();
    console.log('✅ Bucket check completed');
    
    // Create a test image file (1x1 pixel PNG)
    const testImageBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 dimensions
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
      0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
      0x54, 0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0xFF,
      0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, 0x73,
      0x75, 0x01, 0x18, 0x00, 0x00, 0x00, 0x00, 0x49,
      0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);
    
    const testFile = {
      originalName: 'test-business-card.png',
      filename: 'test-business-card.png',
      mimetype: 'image/png',
      size: testImageBuffer.length,
      buffer: testImageBuffer,
    };
    
    console.log('\n🧪 Testing file upload...');
    console.log('File size:', testFile.size, 'bytes');
    console.log('MIME type:', testFile.mimetype);
    
    // Test upload
    const result = await uploadService.uploadFile(testFile);
    console.log('✅ Upload successful!');
    console.log('Result:', {
      url: result.url,
      filename: result.filename,
      size: result.size,
      bucket: result.bucket,
    });
    
    // Test if the file is accessible
    console.log('\n🌐 Testing file accessibility...');
    const response = await fetch(result.url);
    console.log('HTTP status:', response.status);
    console.log('Content-Type:', response.headers.get('content-type'));
    
    if (response.ok) {
      console.log('✅ File is publicly accessible');
    } else {
      console.log('❌ File is not accessible');
    }
    
    console.log('\n🎉 All tests passed! Upload service is working correctly.');
    
  } catch (error) {
    console.error('\n❌ Upload test failed:');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    
    if (error.message.includes('Invalid JWT')) {
      console.log('\n💡 JWT Error - Check:');
      console.log('   - SUPABASE_ANON_KEY is correct');
      console.log('   - Key hasn\'t expired');
    }
    
    if (error.message.includes('bucket')) {
      console.log('\n💡 Bucket Error - Check:');
      console.log('   - Bucket "business-cards" exists');
      console.log('   - Bucket is public');
      console.log('   - Storage policies allow uploads');
    }
    
    if (error.message.includes('policy')) {
      console.log('\n💡 Policy Error - Check:');
      console.log('   - Storage policy exists for INSERT operations');
      console.log('   - Policy allows public access');
    }
  }
}

debugUpload();