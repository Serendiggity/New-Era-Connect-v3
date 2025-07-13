#!/usr/bin/env tsx

import { ocrService } from '../features/contacts/ocr.service.js';

// Test the name extraction logic with sample OCR text
const testTexts = [
  // Common business card formats
  "John Smith\nSenior Developer\nTech Corp Inc\njohn@techcorp.com\n(555) 123-4567",
  "JANE DOE\nMarketing Manager\nABC Company\njane.doe@abc.com\n555-987-6543",
  "Mike Johnson\nCEO\nStartup LLC\nmike@startup.com",
  "Sarah Wilson\nsarah.wilson@company.org\n+1-555-123-4567",
  "Tech Corp Inc\nJohn Smith\nDeveloper\njohn@tech.com",
  "ABC COMPANY\nJane Doe\nManager\njane@abc.com\n555-123-4567",
];

console.log('Testing OCR name extraction logic...\n');

for (let i = 0; i < testTexts.length; i++) {
  const text = testTexts[i];
  console.log(`\n=== Test ${i + 1} ===`);
  console.log('Input text:');
  console.log(text);
  console.log('\nParsing...');
  
  // Create mock OCR result
  const mockOcrResult = {
    text: text,
    confidence: 0.85,
    words: text.split(/\s+/).map((word, idx) => ({
      text: word,
      confidence: 0.8 + (Math.random() * 0.2), // Random confidence between 0.8-1.0
      bbox: { x0: idx * 50, y0: 0, x1: (idx + 1) * 50, y1: 20 }
    }))
  };
  
  const result = ocrService.parseContactData(mockOcrResult);
  
  console.log('\nExtracted data:');
  console.log('- Name:', result.full_name || 'NOT FOUND');
  console.log('- Email:', result.email || 'NOT FOUND');
  console.log('- Company:', result.company || 'NOT FOUND');
  console.log('- Phone:', result.phone || 'NOT FOUND');
  console.log('- Confidence:', result.confidence);
}

console.log('\n=== Name Detection Logic Test ===');

// Test the looksLikeName function directly
const testNames = [
  'John Smith',
  'JANE DOE', 
  'Mike Johnson',
  'Sarah Wilson',
  'J. Smith',
  'Mary-Jane Watson',
  "O'Connor",
  'Tech Corp Inc',
  'ABC COMPANY',
  'john@email.com',
  '555-123-4567',
  'CEO',
  'Senior Developer'
];

console.log('\nTesting individual name detection:');
for (const name of testNames) {
  // Access the private method via casting
  const service = ocrService as any;
  const isName = service.looksLikeName(name);
  console.log(`"${name}" -> ${isName ? 'YES' : 'NO'}`);
}