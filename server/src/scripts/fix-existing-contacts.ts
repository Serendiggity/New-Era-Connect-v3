/**
 * Fix existing contacts with incorrect data classification
 * Specifically addresses cases where job titles appear in name fields
 */

import { loadEnvironment } from '../shared/utils/env-loader.js';

// Load environment variables safely
loadEnvironment();

import { db } from '../shared/db/connection.js';
import { contacts } from '../shared/db/schema.js';
import { eq, like, or, sql } from 'drizzle-orm';
import { contactsService } from '../features/contacts/contacts.service.js';
import { ocrJobService } from '../features/contacts/ocr-job.service.js';

interface FixResult {
  contactId: number;
  originalName: string;
  action: 'reprocessed' | 'manual_fix' | 'skipped';
  newName?: string;
  reason: string;
}

async function fixExistingContacts(): Promise<void> {
  console.log('🔧 Starting contact data cleanup...');
  
  const results: FixResult[] = [];
  
  try {
    // Find contacts with problematic names
    const problematicContacts = await findProblematicContacts();
    
    console.log(`📋 Found ${problematicContacts.length} contacts needing attention`);
    
    for (const contact of problematicContacts) {
      console.log(`\\n🔍 Processing contact ${contact.id}: "${contact.fullName}"`);
      
      const result: FixResult = {
        contactId: contact.id,
        originalName: contact.fullName || 'Unknown',
        action: 'skipped',
        reason: 'No action needed'
      };
      
      // Strategy 1: Re-process with OCR if business card URL exists
      if (contact.businessCardUrl) {
        console.log('  📸 Business card URL found, attempting OCR re-processing...');
        
        try {
          // Create and process new OCR job
          const ocrJob = await ocrJobService.createJob({
            contact_id: contact.id,
            business_card_url: contact.businessCardUrl,
          });
          
          await ocrJobService.processJob(ocrJob.id);
          
          // Check if the contact was updated
          const updated = await db
            .select()
            .from(contacts)
            .where(eq(contacts.id, contact.id))
            .limit(1);
            
          if (updated[0] && updated[0].fullName !== contact.fullName) {
            result.action = 'reprocessed';
            result.newName = updated[0].fullName;
            result.reason = 'OCR re-processing with OpenAI enhancement';
            console.log(`  ✅ Re-processed successfully: "${result.newName}"`);
          } else {
            result.reason = 'OCR re-processing did not change the name';
            console.log('  ⚠️ Re-processing did not change the name');
          }
          
        } catch (error) {
          console.log(`  ❌ OCR re-processing failed: ${error}`);
          result.reason = `OCR re-processing failed: ${error}`;
        }
      }
      
      // Strategy 2: Manual fixes for known patterns
      if (result.action === 'skipped') {
        const manualFix = attemptManualFix(contact);
        if (manualFix) {
          console.log(`  🔧 Applying manual fix: "${manualFix.newName}"`);
          
          try {
            await contactsService.update(contact.id, {
              id: contact.id,
              full_name: manualFix.newName,
              title: manualFix.newTitle,
            });
            
            result.action = 'manual_fix';
            result.newName = manualFix.newName;
            result.reason = manualFix.reason;
            console.log(`  ✅ Manual fix applied successfully`);
            
          } catch (error) {
            console.log(`  ❌ Manual fix failed: ${error}`);
            result.reason = `Manual fix failed: ${error}`;
          }
        }
      }
      
      results.push(result);
    }
    
    // Summary report
    console.log('\\n📊 Cleanup Summary:');
    console.log(`  Total contacts processed: ${results.length}`);
    console.log(`  Re-processed with OCR: ${results.filter(r => r.action === 'reprocessed').length}`);
    console.log(`  Manual fixes applied: ${results.filter(r => r.action === 'manual_fix').length}`);
    console.log(`  Skipped (no action needed): ${results.filter(r => r.action === 'skipped').length}`);
    
    // Detailed results
    console.log('\\n📋 Detailed Results:');
    results.forEach(result => {
      const statusEmoji = result.action === 'reprocessed' ? '🔄' : 
                         result.action === 'manual_fix' ? '🔧' : '⏭️';
      console.log(`  ${statusEmoji} Contact ${result.contactId}:`);
      console.log(`    Original: "${result.originalName}"`);
      if (result.newName) {
        console.log(`    New: "${result.newName}"`);
      }
      console.log(`    Action: ${result.action}`);
      console.log(`    Reason: ${result.reason}`);
    });
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    throw error;
  }
}

/**
 * Find contacts with problematic names
 */
async function findProblematicContacts() {
  console.log('🔍 Searching for problematic contacts...');
  
  // Find contacts where name looks like a job title or placeholder
  const problematic = await db
    .select()
    .from(contacts)
    .where(
      or(
        // Obvious job titles
        like(contacts.fullName, '%SPECIALIST%'),
        like(contacts.fullName, '%MANAGER%'),
        like(contacts.fullName, '%DIRECTOR%'),
        like(contacts.fullName, '%CEO%'),
        like(contacts.fullName, '%PRESIDENT%'),
        like(contacts.fullName, '%COORDINATOR%'),
        like(contacts.fullName, '%REPRESENTATIVE%'),
        like(contacts.fullName, '%AGENT%'),
        like(contacts.fullName, '%CONSULTANT%'),
        like(contacts.fullName, '%REAL ESTATE%'),
        
        // Placeholder names
        eq(contacts.fullName, 'Processing...'),
        eq(contacts.fullName, 'Contact'),
        
        // Duplicate values in name and company
        sql`${contacts.fullName} = ${contacts.company}`,
        
        // Names that are clearly not names
        like(contacts.fullName, '%.com%'),
        like(contacts.fullName, '%@%'),
        like(contacts.fullName, '%phone%'),
        like(contacts.fullName, '%tel%'),
      )
    );
    
  console.log(`  Found ${problematic.length} potentially problematic contacts`);
  
  // Log examples
  problematic.slice(0, 5).forEach(contact => {
    console.log(`    ID ${contact.id}: "${contact.fullName}" (company: "${contact.company}")`);
  });
  
  return problematic;
}

/**
 * Attempt manual fix for known patterns
 */
function attemptManualFix(contact: any): { newName: string; newTitle?: string; reason: string } | null {
  const name = contact.fullName?.trim();
  const email = contact.email;
  const company = contact.company;
  
  if (!name) return null;
  
  // Fix 1: Move job titles to title field
  const jobTitlePatterns = [
    /^REAL ESTATE SPECIALIST$/i,
    /^SALES MANAGER$/i,
    /^MARKETING DIRECTOR$/i,
    /^BUSINESS DEVELOPMENT MANAGER$/i,
    /^ACCOUNT MANAGER$/i,
    /^PROJECT MANAGER$/i,
    /^OPERATIONS MANAGER$/i,
  ];
  
  for (const pattern of jobTitlePatterns) {
    if (pattern.test(name)) {
      // Try to extract name from email
      const nameFromEmail = extractNameFromEmail(email);
      if (nameFromEmail) {
        return {
          newName: nameFromEmail,
          newTitle: name,
          reason: `Moved job title "${name}" to title field, extracted name from email`
        };
      } else {
        return {
          newName: 'Contact',
          newTitle: name,
          reason: `Moved job title "${name}" to title field, used fallback name`
        };
      }
    }
  }
  
  // Fix 2: Handle "Processing..." placeholder
  if (name === 'Processing...') {
    const nameFromEmail = extractNameFromEmail(email);
    if (nameFromEmail) {
      return {
        newName: nameFromEmail,
        reason: 'Replaced "Processing..." with name extracted from email'
      };
    } else {
      return {
        newName: 'Contact',
        reason: 'Replaced "Processing..." with fallback name'
      };
    }
  }
  
  // Fix 3: Handle duplicate name/company values
  if (name === company && company) {
    const nameFromEmail = extractNameFromEmail(email);
    if (nameFromEmail) {
      return {
        newName: nameFromEmail,
        reason: 'Resolved duplicate name/company by extracting name from email'
      };
    }
  }
  
  return null;
}

/**
 * Extract name from email address
 */
function extractNameFromEmail(email?: string): string | null {
  if (!email) return null;
  
  try {
    const localPart = email.split('@')[0];
    
    // Handle common patterns: john.smith, john_smith, johnsmith
    const namePattern = /^([a-zA-Z]+)[._]?([a-zA-Z]+)?/;
    const match = localPart.match(namePattern);
    
    if (match) {
      const firstName = capitalizeWord(match[1]);
      const lastName = match[2] ? capitalizeWord(match[2]) : '';
      return lastName ? `${firstName} ${lastName}` : firstName;
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Capitalize first letter of word
 */
function capitalizeWord(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

// Run the cleanup
fixExistingContacts().catch(console.error);