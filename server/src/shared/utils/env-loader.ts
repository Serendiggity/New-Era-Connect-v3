/**
 * Centralized environment loading utility
 * Eliminates hardcoded credentials and ensures consistent env loading across all scripts
 */

import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Load environment variables from the project root .env file
 * This works consistently whether called from scripts, services, or tests
 */
export function loadEnvironment(): void {
  // Load from project root .env file
  const rootEnvPath = resolve(__dirname, '../../../.env');
  
  config({ path: rootEnvPath });
  
  // Validate required environment variables
  const required = [
    'DATABASE_URL',
    'SUPABASE_URL', 
    'SUPABASE_ANON_KEY',
    'OPENAI_API_KEY'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing);
    console.error('📁 Looking for .env file at:', rootEnvPath);
    console.error('💡 Make sure .env file exists in project root with all required variables');
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  console.log('✅ Environment loaded successfully');
  console.log('📊 Environment check:');
  console.log(`  NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`  PORT: ${process.env.PORT}`);
  console.log(`  API_PORT: ${process.env.API_PORT}`);
  console.log(`  DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Set' : '❌ Missing'}`);
  console.log(`  SUPABASE_URL: ${process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing'}`);
  console.log(`  OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Missing'}`);
}

/**
 * Get environment variables with fallbacks and validation
 */
export function getEnvConfig() {
  return {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: parseInt(process.env.PORT || '3000'),
    API_PORT: parseInt(process.env.API_PORT || '8000'),
    DATABASE_URL: process.env.DATABASE_URL!,
    SUPABASE_URL: process.env.SUPABASE_URL!,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY!,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY!,
  };
}

/**
 * Safely log environment status without exposing secrets
 */
export function logEnvironmentStatus(): void {
  const config = getEnvConfig();
  
  console.log('🔧 Environment Configuration:');
  console.log(`  Mode: ${config.NODE_ENV}`);
  console.log(`  Server Port: ${config.PORT}`);
  console.log(`  API Port: ${config.API_PORT}`);
  console.log(`  Database: ${config.DATABASE_URL.substring(0, 20)}...`);
  console.log(`  Supabase: ${config.SUPABASE_URL}`);
  console.log(`  OpenAI: ${config.OPENAI_API_KEY ? 'Configured' : 'Missing'}`);
}