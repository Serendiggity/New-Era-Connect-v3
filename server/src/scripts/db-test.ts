import { config } from 'dotenv';
import { join } from 'path';
import postgres from 'postgres';

// Load environment variables from root directory
config({ path: join(process.cwd(), '../.env') });

async function testConnection() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  console.log('🔗 Testing basic database connection...');
  console.log('📡 URL:', process.env.DATABASE_URL.replace(/:[^:@]*@/, ':***@'));

  // Try different connection approaches
  const configs = [
    { name: 'IPv4 only', opts: { max: 1, ssl: 'require', family: 4 } },
    { name: 'No SSL', opts: { max: 1, family: 4 } },
    { name: 'Default', opts: { max: 1 } },
  ];

  for (const config of configs) {
    try {
      console.log(`\n🧪 Trying ${config.name}...`);
      const client = postgres(process.env.DATABASE_URL!, config.opts);
      
      const result = await client`SELECT version(), current_database(), current_user`;
      console.log('✅ Success!');
      console.log('   Version:', result[0].version.split(' ')[0] + ' ' + result[0].version.split(' ')[1]);
      console.log('   Database:', result[0].current_database);
      console.log('   User:', result[0].current_user);
      
      await client.end();
      return true;
    } catch (error) {
      console.log('❌ Failed:', error.message);
    }
  }
  
  console.log('\n💡 All connection attempts failed. Consider using Supabase SQL Editor instead.');
  return false;
}

testConnection();