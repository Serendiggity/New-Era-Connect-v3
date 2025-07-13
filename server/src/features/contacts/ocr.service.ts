import Tesseract from 'tesseract.js';
import { z } from 'zod';
import { openaiClassificationService } from './openai-classification.service.js';

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

// Parsed contact data from OCR with field-level confidence
export interface ParsedContactData {
  full_name?: string;
  email?: string;
  company?: string;
  title?: string;
  phone?: string;
  linkedin_url?: string;
  confidence: number; // Overall confidence
  field_confidence?: { // Field-level confidence scores
    full_name?: number;
    email?: number;
    company?: number;
    title?: number;
    phone?: number;
    linkedin_url?: number;
  };
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
    
    console.log('[OCR DEBUG] Raw OCR text:', JSON.stringify(text));
    console.log('[OCR DEBUG] OCR lines:', lines);
    
    const result: ParsedContactData = {
      confidence: ocrResult.confidence,
      field_confidence: {},
      raw_text: text,
      raw_data: ocrResult,
    };

    // Extract email with confidence scoring
    const emailData = this.extractEmailWithConfidence(text, ocrResult.words);
    if (emailData) {
      result.email = emailData.value;
      result.field_confidence!.email = emailData.confidence;
    }

    // Extract phone with confidence scoring
    const phoneData = this.extractPhoneWithConfidence(text, ocrResult.words);
    if (phoneData) {
      result.phone = phoneData.value;
      result.field_confidence!.phone = phoneData.confidence;
    }

    // Extract LinkedIn with confidence scoring
    const linkedinData = this.extractLinkedInWithConfidence(text, ocrResult.words);
    if (linkedinData) {
      result.linkedin_url = linkedinData.value;
      result.field_confidence!.linkedin_url = linkedinData.confidence;
    }

    // Parse structured data from lines with confidence
    this.parseNameAndCompanyWithConfidence(lines, result, ocrResult.words);
    this.parseTitleWithConfidence(lines, result, ocrResult.words);

    console.log('[OCR DEBUG] Field confidence scores:', result.field_confidence);

    return result;
  }

  /**
   * Extract email with confidence based on OCR word confidence
   */
  private extractEmailWithConfidence(text: string, words: any[]): {value: string, confidence: number} | null {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
    const emailMatch = text.match(emailRegex);
    
    if (!emailMatch) return null;
    
    const email = emailMatch[0].toLowerCase();
    
    // Calculate confidence based on OCR word confidence for email components
    const emailWords = words.filter(word => 
      emailMatch[0].includes(word.text) || word.text.includes('@')
    );
    
    const avgConfidence = emailWords.length > 0 
      ? emailWords.reduce((sum, word) => sum + word.confidence, 0) / emailWords.length
      : 0.5;
    
    // Boost confidence for valid email patterns
    const domainConfidence = /.+@.+\..+/.test(email) ? 0.2 : 0;
    
    return {
      value: email,
      confidence: Math.min(0.95, avgConfidence + domainConfidence)
    };
  }

  /**
   * Extract phone with confidence based on OCR word confidence
   */
  private extractPhoneWithConfidence(text: string, words: any[]): {value: string, confidence: number} | null {
    const phoneRegex = /(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/;
    const phoneMatch = text.match(phoneRegex);
    
    if (!phoneMatch) return null;
    
    // Find OCR words that likely contain phone digits
    const phoneWords = words.filter(word => 
      /\d/.test(word.text) && phoneMatch[0].includes(word.text.replace(/\D/g, ''))
    );
    
    const avgConfidence = phoneWords.length > 0 
      ? phoneWords.reduce((sum, word) => sum + word.confidence, 0) / phoneWords.length
      : 0.5;
    
    // Boost confidence for complete 10-digit numbers
    const formatConfidence = /^\+?1?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}$/.test(phoneMatch[0]) ? 0.1 : 0;
    
    return {
      value: phoneMatch[0],
      confidence: Math.min(0.95, avgConfidence + formatConfidence)
    };
  }

  /**
   * Extract LinkedIn URL with confidence
   */
  private extractLinkedInWithConfidence(text: string, words: any[]): {value: string, confidence: number} | null {
    const linkedinRegex = /(?:linkedin\.com\/in\/|linkedin\.com\/pub\/)([\w\-_]+)/i;
    const linkedinMatch = text.match(linkedinRegex);
    
    if (!linkedinMatch) return null;
    
    // Find words that contain linkedin components
    const linkedinWords = words.filter(word => 
      word.text.toLowerCase().includes('linkedin') || 
      word.text.toLowerCase().includes('in/') ||
      linkedinMatch[1].includes(word.text)
    );
    
    const avgConfidence = linkedinWords.length > 0 
      ? linkedinWords.reduce((sum, word) => sum + word.confidence, 0) / linkedinWords.length
      : 0.7; // Default confidence for detected URLs
    
    return {
      value: `https://linkedin.com/in/${linkedinMatch[1]}`,
      confidence: avgConfidence
    };
  }

  /**
   * Parse name and company from OCR lines using enhanced multi-pass analysis
   */
  private parseNameAndCompanyWithConfidence(lines: string[], result: ParsedContactData, words: any[]): void {
    if (lines.length === 0) return;

    console.log('[OCR DEBUG] Starting enhanced name/company parsing for', lines.length, 'lines');
    
    // PASS 1: Identify high-confidence names using enhanced detection
    const nameCandidates: Array<{line: string, index: number, confidence: number}> = [];
    
    lines.forEach((line, index) => {
      if (this.looksLikeName(line)) {
        // Calculate name confidence based on position and characteristics
        let confidence = 0.5; // Base confidence
        
        // First few lines are more likely to be names
        if (index === 0) confidence += 0.3;
        else if (index === 1) confidence += 0.2;
        else if (index === 2) confidence += 0.1;
        
        // Boost confidence for name patterns
        const namePatterns = [
          /^[A-Z][a-z]+ [A-Z][a-z]+$/, // First Last
          /^[A-Z][a-z]+ [A-Z]\. [A-Z][a-z]+$/, // First M. Last
          /^Dr\.|Mr\.|Mrs\.|Ms\./ // With title
        ];
        
        if (namePatterns.some(pattern => pattern.test(line))) {
          confidence += 0.2;
        }
        
        // Reduce confidence if line has business indicators
        const businessIndicators = ['sales', 'manager', 'director', 'ceo', 'president'];
        if (businessIndicators.some(indicator => line.toLowerCase().includes(indicator))) {
          confidence -= 0.3;
        }
        
        nameCandidates.push({ line, index, confidence });
        console.log('[OCR DEBUG] Name candidate:', line, 'confidence:', confidence);
      }
    });
    
    // PASS 2: Select best name candidate
    if (nameCandidates.length > 0) {
      const bestCandidate = nameCandidates.reduce((best, current) => 
        current.confidence > best.confidence ? current : best
      );
      
      if (bestCandidate.confidence > 0.6) {
        result.full_name = this.cleanName(bestCandidate.line);
        result.field_confidence!.full_name = bestCandidate.confidence;
        console.log('[OCR DEBUG] Selected high-confidence name:', result.full_name, 'confidence:', bestCandidate.confidence);
      }
    }
    
    // PASS 3: Fallback name detection if no high-confidence name found
    if (!result.full_name) {
      console.log('[OCR DEBUG] No high-confidence name found, trying fallback methods');
      
      // Try more permissive detection on first few lines
      for (let i = 0; i < Math.min(lines.length, 3); i++) {
        const line = lines[i];
        
        // Skip obvious non-names
        if (this.isDefinitelyNotName(line)) continue;
        
        // Check if it could be a name (more permissive)
        if (this.couldBeName(line)) {
          result.full_name = this.cleanName(line);
          result.field_confidence!.full_name = 0.4; // Lower confidence for fallback
          console.log('[OCR DEBUG] Using permissive fallback name:', result.full_name);
          break;
        }
      }
      
      // Last resort: generate from email
      if (!result.full_name && result.email) {
        result.full_name = this.generateNameFromEmail(result.email);
        result.field_confidence!.full_name = 0.3; // Low confidence for generated names
        console.log('[OCR DEBUG] Generated name from email:', result.full_name);
      }
      
      // Final fallback
      if (!result.full_name) {
        result.full_name = 'Contact';
        result.field_confidence!.full_name = 0.1; // Very low confidence for generic names
        console.log('[OCR DEBUG] Using generic fallback name');
      }
    }

    // PASS 4: Enhanced company detection
    this.parseCompany(lines, result);
  }

  /**
   * Check if a line is definitely not a name (strict)
   */
  private isDefinitelyNotName(line: string): boolean {
    const lower = line.toLowerCase();
    const definitelyNot = [
      '@', 'www', '.com', 'phone', 'tel', 'email', 'fax',
      'inc', 'corp', 'llc', 'ltd', 'company'
    ];
    return definitelyNot.some(indicator => lower.includes(indicator)) ||
           /^\+?[\d\s\-\(\)]+$/.test(line); // Phone number pattern
  }

  /**
   * Check if a line could possibly be a name (permissive for fallback)
   */
  private couldBeName(line: string): boolean {
    const trimmed = line.trim();
    if (trimmed.length < 2 || trimmed.length > 60) return false;
    
    const words = trimmed.split(/\s+/);
    if (words.length > 4) return false;
    
    // Must start with capital and contain letters
    return /^[A-Z]/.test(trimmed) && /[a-zA-Z]/.test(trimmed);
  }

  /**
   * Generate a readable name from email address
   */
  private generateNameFromEmail(email: string): string {
    const prefix = email.split('@')[0];
    return prefix
      .replace(/[._-]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Enhanced company detection with confidence scoring
   */
  private parseCompany(lines: string[], result: ParsedContactData): void {
    const companyKeywords = [
      'inc', 'corp', 'corporation', 'llc', 'ltd', 'limited', 'company', 'co.',
      'technologies', 'solutions', 'services', 'group', 'holdings', 'enterprises'
    ];
    
    // Look for explicit company indicators
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      if (companyKeywords.some(keyword => lowerLine.includes(keyword))) {
        result.company = line;
        result.field_confidence!.company = 0.85; // High confidence for keyword matches
        console.log('[OCR DEBUG] Found company with keywords:', line);
        return;
      }
    }

    // Look for all-caps lines (common for company names)
    const allCapsLine = lines.find(line => 
      line === line.toUpperCase() && 
      line.length > 2 && 
      line !== result.full_name &&
      !this.isDefinitelyNotName(line)
    );
    
    if (allCapsLine) {
      result.company = allCapsLine;
      result.field_confidence!.company = 0.65; // Medium confidence for all-caps
      console.log('[OCR DEBUG] Found company (all caps):', allCapsLine);
    }
  }

  /**
   * Parse job title from OCR lines with confidence scoring
   */
  private parseTitleWithConfidence(lines: string[], result: ParsedContactData, words: any[]): void {
    const titleKeywords = [
      'director', 'manager', 'ceo', 'cto', 'cfo', 'president', 'vice president',
      'senior', 'lead', 'head', 'chief', 'coordinator', 'specialist', 'analyst',
      'engineer', 'developer', 'consultant', 'advisor', 'founder', 'owner'
    ];

    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      if (titleKeywords.some(keyword => lowerLine.includes(keyword))) {
        result.title = line;
        
        // Calculate confidence based on keyword strength and position
        let confidence = 0.7; // Base confidence for keyword match
        
        // Executive titles get higher confidence
        const executiveTitles = ['ceo', 'cto', 'cfo', 'president', 'director', 'manager'];
        if (executiveTitles.some(title => lowerLine.includes(title))) {
          confidence += 0.15;
        }
        
        // Reduce confidence if it looks too much like a name
        if (this.looksLikeName(line)) {
          confidence -= 0.3;
        }
        
        result.field_confidence!.title = Math.max(0.1, confidence);
        console.log('[OCR DEBUG] Found title:', line, 'confidence:', result.field_confidence!.title);
        break;
      }
    }
  }

  /**
   * Check if a line looks like a person's name with enhanced heuristics
   */
  private looksLikeName(line: string): boolean {
    const trimmed = line.trim();
    if (!trimmed) return false;
    
    const words = trimmed.split(/\s+/);
    
    // Names typically have 1-4 words
    if (words.length < 1 || words.length > 4) return false;
    
    // All words should start with capital letters for names
    if (!words.every(word => /^[A-Z]/.test(word))) return false;
    
    const lowerLine = trimmed.toLowerCase();
    
    // ENHANCED: Comprehensive exclusion lists
    const definitelyNotNames = [
      // Company indicators
      'inc', 'corp', 'llc', 'ltd', 'company', 'co.', 'corporation', 'limited', 'enterprises',
      'technologies', 'solutions', 'services', 'group', 'holdings', 'international', 'global',
      
      // Contact info indicators
      '@', 'www', '.com', '.net', '.org', 'phone', 'tel', 'email', 'fax', 'mobile', 'cell',
      'http', 'https', 'linkedin', 'facebook', 'twitter',
      
      // Address indicators
      'street', 'avenue', 'road', 'drive', 'suite', 'floor', 'building', 'plaza', 'center',
      'boulevard', 'lane', 'way', 'circle', 'court', 'place',
      
      // Business card layout words
      'business', 'card', 'contact', 'information', 'details', 'office', 'headquarters'
    ];
    
    if (definitelyNotNames.some(word => lowerLine.includes(word))) return false;
    
    // ENHANCED: More comprehensive job title detection
    const jobTitleIndicators = [
      // Executive titles
      'president', 'ceo', 'cto', 'cfo', 'coo', 'chairman', 'chairwoman', 'founder', 'owner',
      'executive', 'officer', 'principal', 'partner', 'proprietor',
      
      // Management titles
      'manager', 'director', 'supervisor', 'administrator', 'coordinator', 'lead', 'head',
      'chief', 'senior', 'junior', 'associate', 'assistant', 'deputy', 'vice',
      
      // Professional roles
      'engineer', 'developer', 'programmer', 'analyst', 'consultant', 'advisor', 'specialist',
      'technician', 'architect', 'designer', 'scientist', 'researcher', 'expert',
      
      // Industry-specific roles
      'sales', 'marketing', 'finance', 'accounting', 'legal', 'human', 'resources',
      'operations', 'production', 'quality', 'compliance', 'security', 'technology',
      
      // Professional qualifiers
      'practitioner', 'professional', 'representative', 'agent', 'broker', 'planner',
      'strategist', 'creative', 'technical', 'business', 'customer', 'client'
    ];
    
    // Check if any word is a job title indicator
    for (const word of words) {
      const lowerWord = word.toLowerCase();
      if (jobTitleIndicators.some(indicator => 
        lowerWord === indicator || 
        lowerWord.startsWith(indicator) || 
        lowerWord.endsWith(indicator)
      )) {
        return false;
      }
    }
    
    // Additional heuristics
    if (/^\d+$/.test(trimmed.replace(/\s/g, ''))) return false; // All numbers
    if (trimmed.length > 60) return false; // Too long
    if (words.length === 1 && words[0].length < 2) return false; // Single letter
    
    // ENHANCED: Positive name indicators
    const namePatterns = [
      /^[A-Z][a-z]+ [A-Z][a-z]+$/, // First Last
      /^[A-Z][a-z]+ [A-Z]\.$/, // First M. (middle initial)
      /^[A-Z]\. [A-Z][a-z]+$/, // F. Last
      /^[A-Z][a-z]+ [A-Z][a-z]+ [A-Z][a-z]+$/, // First Middle Last
      /^Dr\.|Mr\.|Mrs\.|Ms\./, // Titles that indicate names follow
    ];
    
    // If it matches common name patterns, boost confidence
    const matchesNamePattern = namePatterns.some(pattern => pattern.test(trimmed));
    
    // ENHANCED: Word analysis for names
    const hasCommonNameWords = words.some(word => {
      const lower = word.toLowerCase();
      // Common first/last name patterns (basic check)
      return (
        lower.length >= 2 && 
        lower.length <= 15 &&
        /^[a-z]+$/.test(lower) && // Only letters
        !jobTitleIndicators.includes(lower)
      );
    });
    
    return matchesNamePattern || (hasCommonNameWords && words.length >= 2);
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
   * Enhance contact data using OpenAI classification
   * This is the new primary method that should be used instead of validateAndEnhanceData
   */
  async enhanceWithOpenAI(data: ParsedContactData): Promise<ParsedContactData> {
    console.log('[OCR ENHANCEMENT] Starting OpenAI enhancement...');
    
    try {
      // Prepare input for OpenAI classification
      const classificationInput = {
        raw_text: data.raw_text,
        initial_extraction: {
          full_name: data.full_name,
          company: data.company,
          title: data.title,
          email: data.email,
          phone: data.phone,
          linkedin_url: data.linkedin_url,
        },
        ocr_confidence: data.confidence,
      };

      // Get OpenAI classification
      const classification = await openaiClassificationService.classifyContactFields(classificationInput);
      
      console.log('[OCR ENHANCEMENT] OpenAI classification completed');
      console.log('[OCR ENHANCEMENT] Issues found:', classification.issues_found);
      console.log('[OCR ENHANCEMENT] Overall confidence:', classification.overall_confidence);

      // Apply OpenAI corrections
      const enhanced: ParsedContactData = {
        ...data,
        full_name: classification.corrected_fields.full_name || data.full_name,
        company: classification.corrected_fields.company || data.company,
        title: classification.corrected_fields.title || data.title,
        email: classification.corrected_fields.email || data.email,
        phone: classification.corrected_fields.phone || data.phone,
        linkedin_url: classification.corrected_fields.linkedin_url || data.linkedin_url,
        confidence: classification.overall_confidence,
        field_confidence: {
          full_name: classification.confidence_scores.full_name || data.field_confidence?.full_name,
          company: classification.confidence_scores.company || data.field_confidence?.company,
          title: classification.confidence_scores.title || data.field_confidence?.title,
          email: classification.confidence_scores.email || data.field_confidence?.email,
          phone: classification.confidence_scores.phone || data.field_confidence?.phone,
          linkedin_url: classification.confidence_scores.linkedin_url || data.field_confidence?.linkedin_url,
        },
      };

      // Add OpenAI metadata to raw data
      enhanced.raw_data = {
        ...data.raw_data,
        openai_classification: {
          issues_found: classification.issues_found,
          reasoning: classification.reasoning,
          corrected_fields: classification.corrected_fields,
        },
      };

      console.log('[OCR ENHANCEMENT] Enhanced data:', {
        full_name: enhanced.full_name,
        company: enhanced.company,
        title: enhanced.title,
        confidence: enhanced.confidence,
      });

      // Apply final validation and formatting
      return this.validateAndEnhanceData(enhanced);
      
    } catch (error) {
      console.error('[OCR ENHANCEMENT] OpenAI enhancement failed:', error);
      console.log('[OCR ENHANCEMENT] Falling back to basic validation');
      
      // Fallback to basic validation if OpenAI fails
      return this.validateAndEnhanceData(data);
    }
  }

  /**
   * Validate and enhance parsed contact data (legacy method, now used as fallback)
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