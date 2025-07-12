import { db } from '../../shared/db/connection.js';
import { ocrJobs, contacts, activityLogs } from '../../shared/db/schema.js';
import { eq, and, desc, sql } from 'drizzle-orm';
import { z } from 'zod';
import { ocrService } from './ocr.service.js';
import { uploadService } from './upload.service.js';
import { contactsService } from './contacts.service.js';

// OCR Job status enum
export const OcrJobStatusEnum = z.enum(['pending', 'processing', 'completed', 'failed']);
export type OcrJobStatus = z.infer<typeof OcrJobStatusEnum>;

// OCR Job schemas
export const CreateOcrJobSchema = z.object({
  contact_id: z.number(),
  business_card_url: z.string().url(),
});

export const UpdateOcrJobSchema = z.object({
  id: z.number(),
  status: OcrJobStatusEnum.optional(),
  error_message: z.string().optional(),
  started_at: z.date().optional(),
  completed_at: z.date().optional(),
});

export type CreateOcrJobInput = z.infer<typeof CreateOcrJobSchema>;
export type UpdateOcrJobInput = z.infer<typeof UpdateOcrJobSchema>;

export interface OcrJobResult {
  id: number;
  contactId: number;
  status: OcrJobStatus;
  errorMessage?: string;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
}

export class OcrJobService {
  private readonly userId = 1; // Hard-coded for single-user MVP
  private readonly MAX_RETRY_ATTEMPTS = 3;
  private readonly JOB_TIMEOUT_MS = 120000; // 2 minutes

  /**
   * Create a new OCR job for a contact
   */
  async createJob(data: CreateOcrJobInput): Promise<OcrJobResult> {
    const [newJob] = await db
      .insert(ocrJobs)
      .values({
        contactId: data.contact_id,
        status: 'pending',
        createdAt: new Date(),
      })
      .returning();

    // Log activity
    await this.logActivity('ocr_job_created', 'ocr_job', newJob.id, {
      contactId: data.contact_id,
      businessCardUrl: data.business_card_url,
    });

    return this.mapToResult(newJob);
  }

  /**
   * Process an OCR job
   */
  async processJob(jobId: number): Promise<void> {
    const job = await this.findById(jobId);
    if (!job) {
      throw new Error(`OCR job with id ${jobId} not found`);
    }

    if (job.status !== 'pending') {
      throw new Error(`Cannot process job with status: ${job.status}`);
    }

    // Update job status to processing
    await this.updateJob({
      id: jobId,
      status: 'processing',
      started_at: new Date(),
    });

    try {
      // Get the contact to extract business card URL
      const contact = await contactsService.findById(job.contactId);
      if (!contact.businessCardUrl) {
        throw new Error('Contact does not have a business card URL');
      }

      // Update contact status to processing
      await contactsService.update(contact.id, { status: 'processing' });

      // Download the image
      const imageBuffer = await uploadService.getFileBuffer(contact.businessCardUrl);

      // Validate it's an image
      if (!uploadService.validateImageFile(imageBuffer)) {
        throw new Error('Invalid image file');
      }

      // Preprocess the image
      const processedImage = await ocrService.preprocessImage(imageBuffer);

      // Extract text using OCR
      const ocrResult = await ocrService.extractText(processedImage);

      // Parse contact data from OCR text
      const parsedData = ocrService.parseContactData(ocrResult);

      // Validate and enhance the data
      const enhancedData = ocrService.validateAndEnhanceData(parsedData);

      // Update the contact with OCR results
      const updateData: any = {
        ocr_confidence: enhancedData.confidence,
        ocr_raw_data: enhancedData.raw_data,
        status: enhancedData.confidence >= 0.7 ? 'completed' : 'pending_review',
      };

      // Only update contact fields if they're not already set or if OCR confidence is high
      if (enhancedData.confidence >= 0.8 || !contact.fullName || contact.fullName.trim() === '') {
        if (enhancedData.full_name) updateData.full_name = enhancedData.full_name;
      }
      if (enhancedData.confidence >= 0.8 || !contact.email) {
        if (enhancedData.email) updateData.email = enhancedData.email;
      }
      if (enhancedData.confidence >= 0.8 || !contact.company) {
        if (enhancedData.company) updateData.company = enhancedData.company;
      }
      if (enhancedData.confidence >= 0.8 || !contact.title) {
        if (enhancedData.title) updateData.title = enhancedData.title;
      }
      if (enhancedData.confidence >= 0.8 || !contact.phone) {
        if (enhancedData.phone) updateData.phone = enhancedData.phone;
      }
      if (enhancedData.confidence >= 0.8 || !contact.linkedinUrl) {
        if (enhancedData.linkedin_url) updateData.linkedin_url = enhancedData.linkedin_url;
      }

      await contactsService.update(contact.id, updateData);

      // Mark job as completed
      await this.updateJob({
        id: jobId,
        status: 'completed',
        completed_at: new Date(),
      });

      // Log successful processing
      await this.logActivity('ocr_job_completed', 'ocr_job', jobId, {
        contactId: contact.id,
        confidence: enhancedData.confidence,
        status: updateData.status,
        extractedFields: Object.keys(enhancedData).filter(key => 
          enhancedData[key] && !['confidence', 'raw_text', 'raw_data'].includes(key)
        ),
      });

    } catch (error) {
      console.error(`OCR job ${jobId} failed:`, error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Mark job as failed
      await this.updateJob({
        id: jobId,
        status: 'failed',
        error_message: errorMessage,
        completed_at: new Date(),
      });

      // Update contact status to failed
      await contactsService.update(job.contactId, { status: 'failed' });

      // Log failed processing
      await this.logActivity('ocr_job_failed', 'ocr_job', jobId, {
        contactId: job.contactId,
        error: errorMessage,
      });

      throw error;
    }
  }

  /**
   * Process all pending OCR jobs
   */
  async processPendingJobs(): Promise<{ processed: number; failed: number }> {
    const pendingJobs = await db
      .select()
      .from(ocrJobs)
      .where(eq(ocrJobs.status, 'pending'))
      .orderBy(ocrJobs.createdAt);

    let processed = 0;
    let failed = 0;

    for (const job of pendingJobs) {
      try {
        await this.processJob(job.id);
        processed++;
      } catch (error) {
        console.error(`Failed to process OCR job ${job.id}:`, error);
        failed++;
      }
    }

    // Log batch processing results
    await this.logActivity('ocr_batch_processed', 'ocr_job', null, {
      totalJobs: pendingJobs.length,
      processed,
      failed,
    });

    return { processed, failed };
  }

  /**
   * Find OCR job by ID
   */
  async findById(id: number): Promise<OcrJobResult | null> {
    const result = await db
      .select()
      .from(ocrJobs)
      .where(eq(ocrJobs.id, id))
      .limit(1);

    return result[0] ? this.mapToResult(result[0]) : null;
  }

  /**
   * Find OCR jobs by contact ID
   */
  async findByContactId(contactId: number): Promise<OcrJobResult[]> {
    const results = await db
      .select()
      .from(ocrJobs)
      .where(eq(ocrJobs.contactId, contactId))
      .orderBy(desc(ocrJobs.createdAt));

    return results.map(job => this.mapToResult(job));
  }

  /**
   * Update OCR job
   */
  async updateJob(data: UpdateOcrJobInput): Promise<OcrJobResult> {
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (data.status) updateData.status = data.status;
    if (data.error_message !== undefined) updateData.errorMessage = data.error_message;
    if (data.started_at) updateData.startedAt = data.started_at;
    if (data.completed_at) updateData.completedAt = data.completed_at;

    const [updated] = await db
      .update(ocrJobs)
      .set(updateData)
      .where(eq(ocrJobs.id, data.id))
      .returning();

    return this.mapToResult(updated);
  }

  /**
   * Get OCR job statistics
   */
  async getStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    avgProcessingTime: number;
  }> {
    const statsQuery = await db
      .select({
        status: ocrJobs.status,
        count: sql<number>`count(*)::int`,
      })
      .from(ocrJobs)
      .groupBy(ocrJobs.status);

    const totalCount = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(ocrJobs);

    // Calculate average processing time for completed jobs
    const avgTimeQuery = await db
      .select({
        avgTime: sql<number>`AVG(EXTRACT(EPOCH FROM (completed_at - started_at)))::int`,
      })
      .from(ocrJobs)
      .where(
        and(
          eq(ocrJobs.status, 'completed'),
          sql`started_at IS NOT NULL AND completed_at IS NOT NULL`
        )
      );

    return {
      total: totalCount[0]?.count || 0,
      byStatus: statsQuery.reduce((acc, row) => {
        acc[row.status || 'unknown'] = row.count;
        return acc;
      }, {} as Record<string, number>),
      avgProcessingTime: avgTimeQuery[0]?.avgTime || 0,
    };
  }

  /**
   * Clean up old completed/failed jobs
   */
  async cleanupOldJobs(olderThanDays: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const deletedJobs = await db
      .delete(ocrJobs)
      .where(
        and(
          sql`status IN ('completed', 'failed')`,
          sql`created_at < ${cutoffDate}`
        )
      )
      .returning();

    // Log cleanup activity
    await this.logActivity('ocr_jobs_cleaned', 'ocr_job', null, {
      deletedCount: deletedJobs.length,
      olderThanDays,
    });

    return deletedJobs.length;
  }

  /**
   * Map database row to result object
   */
  private mapToResult(job: any): OcrJobResult {
    return {
      id: job.id,
      contactId: job.contactId,
      status: job.status as OcrJobStatus,
      errorMessage: job.errorMessage || undefined,
      startedAt: job.startedAt || undefined,
      completedAt: job.completedAt || undefined,
      createdAt: job.createdAt,
    };
  }

  /**
   * Log activity
   */
  private async logActivity(
    action: string,
    entityType: string,
    entityId: number | null,
    metadata: any
  ): Promise<void> {
    await db.insert(activityLogs).values({
      action,
      entityType,
      entityId,
      metadata: {
        ...metadata,
        userId: this.userId,
        timestamp: new Date().toISOString(),
      },
    });
  }
}

// Export singleton instance
export const ocrJobService = new OcrJobService();