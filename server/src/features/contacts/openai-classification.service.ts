/**
 * OpenAI-powered text classification service for business card OCR
 * Intelligently classifies extracted text into proper contact fields
 */

import OpenAI from 'openai';
import { z } from 'zod';
import { loadEnvironment, getEnvConfig } from '../../shared/utils/env-loader.js';

// Load environment variables
loadEnvironment();
const config = getEnvConfig();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: config.OPENAI_API_KEY,
});

// Response schema for OpenAI classification
export const OpenAIClassificationResponseSchema = z.object({
  corrected_fields: z.object({
    full_name: z.string().optional(),
    company: z.string().optional(),
    title: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    linkedin_url: z.string().optional(),
  }),
  confidence_scores: z.object({
    full_name: z.number().min(0).max(1).optional(),
    company: z.number().min(0).max(1).optional(),
    title: z.number().min(0).max(1).optional(),
    email: z.number().min(0).max(1).optional(),
    phone: z.number().min(0).max(1).optional(),
    linkedin_url: z.number().min(0).max(1).optional(),
  }),
  issues_found: z.array(z.string()),
  reasoning: z.string(),
  overall_confidence: z.number().min(0).max(1),
});

export type OpenAIClassificationResponse = z.infer<typeof OpenAIClassificationResponseSchema>;

// Input data for classification
export interface ClassificationInput {
  raw_text: string;
  initial_extraction: {
    full_name?: string;
    company?: string;
    title?: string;
    email?: string;
    phone?: string;
    linkedin_url?: string;
  };
  ocr_confidence: number;
}

export class OpenAIClassificationService {
  private readonly MAX_RETRIES = 2;
  private readonly TIMEOUT_MS = 10000; // 10 seconds

  /**
   * Classify and correct OCR extracted fields using OpenAI
   */
  async classifyContactFields(input: ClassificationInput): Promise<OpenAIClassificationResponse> {
    const prompt = this.buildClassificationPrompt(input);
    
    console.log('[OPENAI CLASSIFICATION] Starting field classification...');
    console.log('[OPENAI CLASSIFICATION] Raw text length:', input.raw_text.length);
    console.log('[OPENAI CLASSIFICATION] Initial extraction:', input.initial_extraction);

    let attempt = 0;
    while (attempt < this.MAX_RETRIES) {
      try {
        const response = await this.callOpenAI(prompt);
        const parsed = await this.parseAndValidateResponse(response);
        
        console.log('[OPENAI CLASSIFICATION] Classification successful');
        console.log('[OPENAI CLASSIFICATION] Overall confidence:', parsed.overall_confidence);
        console.log('[OPENAI CLASSIFICATION] Issues found:', parsed.issues_found);
        
        return parsed;
      } catch (error) {
        attempt++;
        console.error(`[OPENAI CLASSIFICATION] Attempt ${attempt} failed:`, error);
        
        if (attempt >= this.MAX_RETRIES) {
          console.error('[OPENAI CLASSIFICATION] All attempts failed, using fallback');
          return this.createFallbackResponse(input);
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }

    return this.createFallbackResponse(input);
  }

  /**
   * Build the classification prompt for OpenAI
   */
  private buildClassificationPrompt(input: ClassificationInput): string {
    return `You are an expert at analyzing business card OCR data. Your task is to intelligently classify extracted text into the correct contact fields.

**Raw OCR Text:**
"${input.raw_text}"

**Initial Field Extraction:**
- Name: "${input.initial_extraction.full_name || 'not detected'}"
- Company: "${input.initial_extraction.company || 'not detected'}"
- Title: "${input.initial_extraction.title || 'not detected'}"
- Email: "${input.initial_extraction.email || 'not detected'}"
- Phone: "${input.initial_extraction.phone || 'not detected'}"
- LinkedIn: "${input.initial_extraction.linkedin_url || 'not detected'}"

**OCR Confidence:** ${(input.ocr_confidence * 100).toFixed(1)}%

**Classification Rules:**
1. **Names** should be actual person names (first/last), not job titles or company names
2. **Job titles** go in "title" field: "Manager", "CEO", "Real Estate Specialist", etc.
3. **Company names** should be organization names, not job descriptions
4. **Never put the same value** in multiple fields (name, company, title)
5. **If name is unclear**, try extracting from email (john.smith@company.com → "John Smith")
6. **If extraction failed completely**, use "Contact" as fallback name

**Common Misclassifications to Fix:**
- "REAL ESTATE SPECIALIST" → title field, not name field
- "MANAGER" → title field, not name field
- Job descriptions as company names → extract actual company if visible

**Response Format:**
Respond with valid JSON only. Provide confidence scores (0.0-1.0) for each field based on how certain you are about the classification.

Example response:
{
  "corrected_fields": {
    "full_name": "John Smith",
    "company": "ABC Real Estate",
    "title": "Real Estate Specialist",
    "email": "john@abcrealestate.com",
    "phone": "(555) 123-4567"
  },
  "confidence_scores": {
    "full_name": 0.9,
    "company": 0.8,
    "title": 0.95,
    "email": 0.99,
    "phone": 0.9
  },
  "issues_found": ["Initial name was job title", "Company field was missing"],
  "reasoning": "Corrected 'Real Estate Specialist' from name to title field, extracted company from context",
  "overall_confidence": 0.88
}`;
  }

  /**
   * Call OpenAI API with timeout and error handling
   */
  private async callOpenAI(prompt: string): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini", // Cost-effective model for this task
        messages: [
          {
            role: "system",
            content: "You are an expert at business card data classification. Respond with valid JSON only."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.1, // Low temperature for consistent results
        max_tokens: 1000,
        response_format: { type: "json_object" }
      }, {
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('OpenAI returned empty response');
      }

      return content;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Parse and validate OpenAI response
   */
  private async parseAndValidateResponse(response: string): Promise<OpenAIClassificationResponse> {
    try {
      const parsed = JSON.parse(response);
      return OpenAIClassificationResponseSchema.parse(parsed);
    } catch (error) {
      console.error('[OPENAI CLASSIFICATION] Response parsing failed:', error);
      console.error('[OPENAI CLASSIFICATION] Raw response:', response);
      throw new Error(`Failed to parse OpenAI response: ${error}`);
    }
  }

  /**
   * Create fallback response when OpenAI fails
   */
  private createFallbackResponse(input: ClassificationInput): OpenAIClassificationResponse {
    console.log('[OPENAI CLASSIFICATION] Creating fallback response');

    // Try basic classification using the original data
    const corrected = { ...input.initial_extraction };
    const issues: string[] = ['OpenAI classification failed, using basic fallback'];
    let overallConfidence = input.ocr_confidence * 0.7; // Reduced confidence for fallback

    // Basic fallback logic
    if (!corrected.full_name || this.looksLikeJobTitle(corrected.full_name)) {
      if (corrected.full_name && this.looksLikeJobTitle(corrected.full_name)) {
        corrected.title = corrected.full_name;
        issues.push('Moved job title from name field to title field');
      }
      
      // Try to extract name from email
      if (corrected.email) {
        const nameFromEmail = this.extractNameFromEmail(corrected.email);
        if (nameFromEmail) {
          corrected.full_name = nameFromEmail;
          issues.push('Generated name from email address');
        } else {
          corrected.full_name = 'Contact';
          issues.push('Used fallback name');
        }
      } else {
        corrected.full_name = 'Contact';
        issues.push('Used fallback name');
      }
      overallConfidence *= 0.6;
    }

    // If company and name are the same, clear company
    if (corrected.company === corrected.full_name) {
      corrected.company = undefined;
      issues.push('Removed duplicate company/name value');
      overallConfidence *= 0.8;
    }

    // Generate confidence scores (conservative for fallback)
    const confidence_scores = {
      full_name: corrected.full_name ? Math.min(0.7, overallConfidence + 0.1) : undefined,
      company: corrected.company ? Math.min(0.6, overallConfidence) : undefined,
      title: corrected.title ? Math.min(0.8, overallConfidence + 0.2) : undefined,
      email: corrected.email ? Math.min(0.9, overallConfidence + 0.3) : undefined,
      phone: corrected.phone ? Math.min(0.8, overallConfidence + 0.2) : undefined,
      linkedin_url: corrected.linkedin_url ? Math.min(0.7, overallConfidence + 0.1) : undefined,
    };

    return {
      corrected_fields: corrected,
      confidence_scores,
      issues_found: issues,
      reasoning: 'OpenAI classification failed, applied basic fallback rules',
      overall_confidence: Math.max(0.1, Math.min(0.6, overallConfidence)), // Cap fallback confidence
    };
  }

  /**
   * Check if text looks like a job title
   */
  private looksLikeJobTitle(text: string): boolean {
    const jobTitleWords = [
      'specialist', 'manager', 'director', 'ceo', 'president', 'coordinator',
      'assistant', 'analyst', 'engineer', 'developer', 'consultant', 'advisor',
      'agent', 'representative', 'executive', 'officer', 'supervisor', 'lead',
      'senior', 'junior', 'head', 'chief', 'principal', 'partner', 'founder',
      'vice', 'real estate', 'sales', 'marketing', 'human resources', 'finance'
    ];

    const lowerText = text.toLowerCase();
    return jobTitleWords.some(word => lowerText.includes(word));
  }

  /**
   * Extract name from email address
   */
  private extractNameFromEmail(email: string): string | null {
    try {
      const localPart = email.split('@')[0];
      
      // Handle common patterns: john.smith, john_smith, johnsmith
      const namePattern = /^([a-zA-Z]+)[._]?([a-zA-Z]+)?/;
      const match = localPart.match(namePattern);
      
      if (match) {
        const firstName = this.capitalizeWord(match[1]);
        const lastName = match[2] ? this.capitalizeWord(match[2]) : '';
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
  private capitalizeWord(word: string): string {
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }

  /**
   * Get usage statistics for monitoring
   */
  async getUsageStats(): Promise<{ enabled: boolean; model: string; timeout: number }> {
    return {
      enabled: !!config.OPENAI_API_KEY,
      model: "gpt-4o-mini",
      timeout: this.TIMEOUT_MS,
    };
  }
}

// Export singleton instance
export const openaiClassificationService = new OpenAIClassificationService();