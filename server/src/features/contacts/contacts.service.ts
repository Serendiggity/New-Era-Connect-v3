import { db } from '../../shared/db/connection.js';
import { contacts, activityLogs } from '../../shared/db/schema.js';
import { eq, and, or, like, desc, sql } from 'drizzle-orm';
import { z } from 'zod';

// Validation schemas
export const ContactStatusEnum = z.enum(['processing', 'completed', 'failed', 'pending_review', 'user_verified']);
export type ContactStatus = z.infer<typeof ContactStatusEnum>;

export const CreateContactSchema = z.object({
  event_id: z.number().optional(),
  full_name: z.string().min(1),
  email: z.string().email().optional(),
  company: z.string().optional(),
  title: z.string().optional(),
  phone: z.string().optional(),
  linkedin_url: z.string().url().optional(),
  business_card_url: z.string().optional(),
  ocr_confidence: z.number().min(0).max(1).optional(),
  ocr_raw_data: z.any().optional(),
  status: ContactStatusEnum.optional().default('processing'),
});

export const UpdateContactSchema = CreateContactSchema.partial().extend({
  id: z.number(),
});

export const ContactFiltersSchema = z.object({
  eventId: z.number().optional(),
  status: ContactStatusEnum.optional(),
  search: z.string().optional(),
  needsReview: z.boolean().optional(),
});

export type CreateContactInput = z.infer<typeof CreateContactSchema>;
export type UpdateContactInput = z.infer<typeof UpdateContactSchema>;
export type ContactFilters = z.infer<typeof ContactFiltersSchema>;

// Service class
export class ContactsService {
  private readonly userId = 1; // Hard-coded for single-user MVP
  private readonly REVIEW_CONFIDENCE_THRESHOLD = 0.7;

  async findAll(filters: ContactFilters) {
    const conditions = [];

    if (filters.eventId) {
      conditions.push(eq(contacts.eventId, filters.eventId));
    }

    if (filters.status) {
      conditions.push(eq(contacts.status, filters.status));
    }

    if (filters.search) {
      const searchPattern = `%${filters.search}%`;
      conditions.push(
        or(
          like(contacts.fullName, searchPattern),
          like(contacts.email, searchPattern),
          like(contacts.company, searchPattern),
          like(contacts.title, searchPattern)
        )
      );
    }

    if (filters.needsReview) {
      conditions.push(
        and(
          eq(contacts.status, 'pending_review'),
          sql`CAST(${contacts.ocrConfidence} AS DECIMAL) < ${this.REVIEW_CONFIDENCE_THRESHOLD}`
        )
      );
    }

    const query = conditions.length > 0 
      ? db.select().from(contacts).where(and(...conditions))
      : db.select().from(contacts);

    const results = await query.orderBy(desc(contacts.createdAt));

    // Log activity
    await this.logActivity('contacts_listed', 'contact', null, { filters });

    return results;
  }

  async findById(id: number) {
    const result = await db
      .select()
      .from(contacts)
      .where(eq(contacts.id, id))
      .limit(1);

    if (!result[0]) {
      throw new Error(`Contact with id ${id} not found`);
    }

    return result[0];
  }

  async create(data: CreateContactInput) {
    // Determine status based on OCR confidence
    let finalStatus = data.status || 'processing';
    
    if (data.ocr_confidence !== undefined) {
      if (data.ocr_confidence >= this.REVIEW_CONFIDENCE_THRESHOLD) {
        finalStatus = 'completed';
      } else {
        finalStatus = 'pending_review';
      }
    }

    const [newContact] = await db
      .insert(contacts)
      .values({
        eventId: data.event_id,
        fullName: data.full_name,
        email: data.email,
        company: data.company,
        title: data.title,
        phone: data.phone,
        linkedinUrl: data.linkedin_url,
        businessCardUrl: data.business_card_url,
        ocrConfidence: data.ocr_confidence?.toString(),
        ocrRawData: data.ocr_raw_data,
        status: finalStatus,
        processedAt: data.ocr_confidence !== undefined ? new Date() : undefined,
      })
      .returning();

    // Log activity
    await this.logActivity('contact_created', 'contact', newContact.id, {
      event_id: data.event_id,
      status: finalStatus,
      ocr_confidence: data.ocr_confidence,
    });

    return newContact;
  }

  async update(id: number, data: UpdateContactInput) {
    const existing = await this.findById(id);

    // Track if this is a user verification
    const isUserVerification = 
      existing.status === 'pending_review' && 
      data.status === 'user_verified';

    const updateData: any = {
      eventId: data.event_id,
      fullName: data.full_name,
      email: data.email,
      company: data.company,
      title: data.title,
      phone: data.phone,
      linkedinUrl: data.linkedin_url,
      businessCardUrl: data.business_card_url,
      ocrConfidence: data.ocr_confidence?.toString(),
      ocrRawData: data.ocr_raw_data,
      status: data.status,
      updatedAt: new Date(),
    };

    if (isUserVerification) {
      updateData.reviewedAt = new Date();
    }

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const [updated] = await db
      .update(contacts)
      .set(updateData)
      .where(eq(contacts.id, id))
      .returning();

    // Log activity
    await this.logActivity(
      isUserVerification ? 'contact_verified' : 'contact_updated',
      'contact',
      id,
      { 
        changes: data,
        previousStatus: existing.status,
        newStatus: data.status,
      }
    );

    return updated;
  }

  async delete(id: number) {
    const existing = await this.findById(id);

    await db.delete(contacts).where(eq(contacts.id, id));

    // Log activity
    await this.logActivity('contact_deleted', 'contact', id, {
      deletedContact: existing,
    });
  }

  async bulkUpdateStatus(contactIds: number[], status: ContactStatus) {
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    if (status === 'user_verified') {
      updateData.reviewedAt = new Date();
    }

    const updated = await db
      .update(contacts)
      .set(updateData)
      .where(sql`${contacts.id} = ANY(${contactIds})`)
      .returning();

    // Log activity
    await this.logActivity('contacts_bulk_status_update', 'contact', null, {
      contactIds,
      newStatus: status,
      count: updated.length,
    });

    return updated;
  }

  async getStats() {
    const statsQuery = await db
      .select({
        status: contacts.status,
        count: sql<number>`count(*)::int`,
      })
      .from(contacts)
      .groupBy(contacts.status);

    const totalCount = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(contacts);

    const needsReviewCount = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(contacts)
      .where(
        and(
          eq(contacts.status, 'pending_review'),
          sql`CAST(${contacts.ocrConfidence} AS DECIMAL) < ${this.REVIEW_CONFIDENCE_THRESHOLD}`
        )
      );

    return {
      total: totalCount[0]?.count || 0,
      byStatus: statsQuery.reduce((acc, row) => {
        acc[row.status || 'unknown'] = row.count;
        return acc;
      }, {} as Record<string, number>),
      needsReview: needsReviewCount[0]?.count || 0,
    };
  }

  async processOcrResult(contactId: number, ocrData: any, confidence: number) {
    const status = confidence >= this.REVIEW_CONFIDENCE_THRESHOLD 
      ? 'completed' 
      : 'pending_review';

    const [updated] = await db
      .update(contacts)
      .set({
        ocrRawData: ocrData,
        ocrConfidence: confidence.toString(),
        status,
        processedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(contacts.id, contactId))
      .returning();

    // Log activity
    await this.logActivity('contact_ocr_processed', 'contact', contactId, {
      confidence,
      status,
      requiresReview: status === 'pending_review',
    });

    return updated;
  }

  private async logActivity(
    action: string,
    entityType: string,
    entityId: number | null,
    metadata: any
  ) {
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
export const contactsService = new ContactsService();