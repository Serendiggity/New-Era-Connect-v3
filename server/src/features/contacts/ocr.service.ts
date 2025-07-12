import Tesseract from 'tesseract.js';
import { z } from 'zod';

// OCR result validation schema
export const OcrResultSchema = z.object({
  text: z.string(),
  confidence: z.number().min(0).max(1),
  words: z.array(z.object({
    text: z.string(),
    confidence: z.number(),
    bbox: z.object({
      x0: z.number(),
      y0: z.number(),
      x1: z.number(),
      y1: z.number(),
    }),
  })),
});

export type OcrResult = z.infer<typeof OcrResultSchema>;

// Parsed contact data from OCR
export interface ParsedContactData {
  full_name?: string;
  email?: string;
  company?: string;
  title?: string;
  phone?: string;
  linkedin_url?: string;
  confidence: number;
  raw_text: string;
  raw_data: any;
}

export class OcrService {
  private readonly CONFIDENCE_THRESHOLD = 0.7;
  private readonly MIN_WORD_CONFIDENCE = 0.5;

  /**
   * Extract text from image using Tesseract.js with image preprocessing
   */
  async extractText(imageBuffer: Buffer): Promise<OcrResult> {
    try {
      // Configure Tesseract for business card recognition
      const { data } = await Tesseract.recognize(imageBuffer, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        },
      });

      // Calculate overall confidence from word-level confidences
      const words = data.words.filter(word => 
        word.confidence >= this.MIN_WORD_CONFIDENCE && word.text.trim().length > 0
      );
      
      const averageConfidence = words.length > 0 
        ? words.reduce((sum, word) => sum + word.confidence, 0) / words.length / 100
        : 0;

      return {
        text: data.text.trim(),
        confidence: Math.round(averageConfidence * 100) / 100,
        words: words.map(word => ({
          text: word.text,
          confidence: word.confidence / 100,
          bbox: word.bbox,
        })),
      };
    } catch (error) {
      console.error('OCR extraction failed:', error);
      throw new Error(`OCR processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse contact information from OCR text
   */
  parseContactData(ocrResult: OcrResult): ParsedContactData {
    const text = ocrResult.text;
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    console.log('[OCR DEBUG] OCR lines:', lines);
    
    const result: ParsedContactData = {
      confidence: ocrResult.confidence,
      raw_text: text,
      raw_data: ocrResult,
    };

    // Extract email using regex
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
    const emailMatch = text.match(emailRegex);
    if (emailMatch) {
      result.email = emailMatch[0].toLowerCase();
    }

    // Extract phone number using regex (supports various formats)
    const phoneRegex = /(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/;
    const phoneMatch = text.match(phoneRegex);
    if (phoneMatch) {
      result.phone = phoneMatch[0];
    }

    // Extract LinkedIn URL
    const linkedinRegex = /(?:linkedin\.com\/in\/|linkedin\.com\/pub\/)([\w\-_]+)/i;
    const linkedinMatch = text.match(linkedinRegex);
    if (linkedinMatch) {
      result.linkedin_url = `https://linkedin.com/in/${linkedinMatch[1]}`;
    }

    // Parse structured data from lines
    this.parseNameAndCompany(lines, result);
    this.parseTitle(lines, result);

    return result;
  }

  /**
   * Parse name and company from OCR lines using heuristics
   */
  private parseNameAndCompany(lines: string[], result: ParsedContactData): void {
    if (lines.length === 0) return;

    // First line is often the name if it looks like a person's name
    const firstLine = lines[0];
    if (this.looksLikeName(firstLine)) {
      result.full_name = this.cleanName(firstLine);
      console.log('[OCR DEBUG] Detected name from first line:', result.full_name);
    } else {
      console.log('[OCR DEBUG] First line did not look like a name:', firstLine);
      
      // Try to find a name in the first few lines
      for (let i = 1; i < Math.min(lines.length, 4); i++) {
        if (this.looksLikeName(lines[i])) {
          result.full_name = this.cleanName(lines[i]);
          console.log('[OCR DEBUG] Detected name from line', i + 1, ':', result.full_name);
          break;
        }
      }
      
      // If still no name found, use the first line as fallback if it's not obviously non-name
      if (!result.full_name && firstLine && !firstLine.includes('@') && !firstLine.includes('www')) {
        result.full_name = this.cleanName(firstLine);
        console.log('[OCR DEBUG] Using first line as fallback name:', result.full_name);
      }
    }

    // Look for company indicators
    const companyKeywords = ['inc', 'corp', 'llc', 'ltd', 'company', 'co.', 'technologies', 'solutions', 'group'];
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      if (companyKeywords.some(keyword => lowerLine.includes(keyword))) {
        result.company = line;
        break;
      }
    }

    // If no company found with keywords, use heuristics
    if (!result.company) {
      // Look for lines that are all caps (common for company names)
      const allCapsLine = lines.find(line => 
        line === line.toUpperCase() && 
        line.length > 2 && 
        line !== result.full_name
      );
      if (allCapsLine) {
        result.company = allCapsLine;
      }
    }
  }

  /**
   * Parse job title from OCR lines
   */
  private parseTitle(lines: string[], result: ParsedContactData): void {
    const titleKeywords = [
      'director', 'manager', 'ceo', 'cto', 'cfo', 'president', 'vice president',
      'senior', 'lead', 'head', 'chief', 'coordinator', 'specialist', 'analyst',
      'engineer', 'developer', 'consultant', 'advisor', 'founder', 'owner'
    ];

    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      if (titleKeywords.some(keyword => lowerLine.includes(keyword))) {
        result.title = line;
        break;
      }
    }
  }

  /**
   * Check if a line looks like a person's name
   */
  private looksLikeName(line: string): boolean {
    // Basic heuristics for name detection
    const words = line.trim().split(/\s+/);
    
    // Should have 1-4 words (allow single names too)
    if (words.length < 1 || words.length > 4) return false;
    
    // At least the first word should start with a capital letter
    if (!/^[A-Z]/.test(words[0])) return false;
    
    // Should not contain common non-name words
    const nonNameWords = ['inc', 'corp', 'llc', 'ltd', 'company', '@', 'www', '.com', 'phone', 'tel', 'email'];
    if (nonNameWords.some(word => line.toLowerCase().includes(word))) return false;
    
    // Should not be all numbers
    if (/^\d+$/.test(line.replace(/\s/g, ''))) return false;
    
    return true;
  }

  /**
   * Clean and format a name
   */
  private cleanName(name: string): string {
    return name
      .replace(/[^\w\s'-]/g, '') // Remove special characters except apostrophes and hyphens
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Preprocess image for better OCR results
   */
  async preprocessImage(imageBuffer: Buffer): Promise<Buffer> {
    // For now, return the original buffer
    // In a production system, you might want to add image preprocessing:
    // - Contrast enhancement
    // - Rotation correction
    // - Noise reduction
    // - Scaling optimization
    return imageBuffer;
  }

  /**
   * Validate and enhance parsed contact data
   */
  validateAndEnhanceData(data: ParsedContactData): ParsedContactData {
    const enhanced = { ...data };

    // Validate email format
    if (enhanced.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(enhanced.email)) {
        delete enhanced.email;
      }
    }

    // Format phone number
    if (enhanced.phone) {
      enhanced.phone = this.formatPhoneNumber(enhanced.phone);
    }

    // Clean and validate LinkedIn URL
    if (enhanced.linkedin_url) {
      if (!enhanced.linkedin_url.startsWith('http')) {
        enhanced.linkedin_url = `https://${enhanced.linkedin_url}`;
      }
    }

    // Adjust confidence based on data quality
    const dataQuality = this.calculateDataQuality(enhanced);
    enhanced.confidence = Math.min(enhanced.confidence, dataQuality);

    return enhanced;
  }

  /**
   * Format phone number to a standard format
   */
  private formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    
    // Format US phone numbers
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    } else if (digits.length === 11 && digits[0] === '1') {
      return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    }
    
    // Return original if not a standard format
    return phone;
  }

  /**
   * Calculate data quality score based on extracted fields
   */
  private calculateDataQuality(data: ParsedContactData): number {
    let score = 0;
    let maxScore = 0;

    // Name is most important
    if (data.full_name) score += 0.4;
    maxScore += 0.4;

    // Email is very important
    if (data.email) score += 0.3;
    maxScore += 0.3;

    // Company and title are moderately important
    if (data.company) score += 0.15;
    maxScore += 0.15;

    if (data.title) score += 0.1;
    maxScore += 0.1;

    // Phone and LinkedIn are nice to have
    if (data.phone) score += 0.05;
    maxScore += 0.05;

    return maxScore > 0 ? score / maxScore : 0;
  }
}

// Export singleton instance
export const ocrService = new OcrService();