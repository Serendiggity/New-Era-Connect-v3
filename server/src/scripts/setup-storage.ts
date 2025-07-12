import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupStorage() {
  console.log('🔍 Checking Supabase Storage configuration...');
  
  try {
    // Test connection
    console.log('✅ Supabase client created successfully');
    console.log(`📍 URL: ${supabaseUrl}`);
    
    // List existing buckets
    console.log('\n📦 Checking existing storage buckets...');
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Failed to list buckets:', listError.message);
      console.log('\n💡 This might mean:');
      console.log('   - Storage is not enabled in your Supabase project');
      console.log('   - The API key doesn\'t have storage permissions');
      console.log('   - Go to https://supabase.com/dashboard > Storage > Settings');
      return;
    }
    
    console.log(`✅ Found ${buckets?.length || 0} existing buckets:`);
    buckets?.forEach(bucket => {
      console.log(`   - ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
    });
    
    // Check if business-cards bucket exists
    const bucketName = 'business-cards';
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
    
    if (bucketExists) {
      console.log(`\n✅ Bucket '${bucketName}' already exists`);
    } else {
      console.log(`\n📦 Creating '${bucketName}' bucket...`);
      
      const { error: createError } = await supabase.storage.createBucket(bucketName, {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'],
        fileSizeLimit: 10 * 1024 * 1024, // 10MB
      });
      
      if (createError) {
        console.error('❌ Failed to create bucket:', createError.message);
        console.log('\n💡 You may need to:');
        console.log('   1. Go to https://supabase.com/dashboard > Storage');
        console.log('   2. Click "Create a new bucket"');
        console.log(`   3. Name it '${bucketName}'`);
        console.log('   4. Make it public');
        console.log('   5. Set file size limit to 10MB');
        return;
      }
      
      console.log(`✅ Successfully created '${bucketName}' bucket`);
    }
    
    // Test upload permissions
    console.log('\n🧪 Testing upload permissions...');
    const testFile = Buffer.from('test-content');
    const testPath = 'test/upload-test.txt';
    
    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(testPath, testFile, {
        contentType: 'text/plain',
        upsert: true,
      });
    
    if (uploadError) {
      console.error('❌ Upload test failed:', uploadError.message);
      console.log('\n💡 Check your storage policies:');
      console.log('   1. Go to https://supabase.com/dashboard > Storage > Policies');
      console.log('   2. Ensure you have policies that allow public uploads');
      return;
    }
    
    console.log('✅ Upload test successful');
    
    // Clean up test file
    await supabase.storage.from(bucketName).remove([testPath]);
    console.log('✅ Test file cleaned up');
    
    console.log('\n🎉 Storage setup complete! Business card uploads should now work.');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

setupStorage();