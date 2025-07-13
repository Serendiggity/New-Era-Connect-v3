import { db } from '../../shared/db/connection.js';
import { contacts, activityLogs } from '../../shared/db/schema.js';
import { eq, and, or, like, desc, sql } from 'drizzle-orm';
import { z } from 'zod';
import { mapContactDbToApi, mapContactApiToDb } from '../../shared/utils/field-mapping.js';

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
  user_modified_fields: z.record(z.boolean()).optional(),
  status: ContactStatusEnum.optional(),
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

/**
 * Contact Creation Status Rules:
 * 
 * Manual Entry:
 * - Respects user status selection from form
 * - Defaults to 'user_verified' if no status provided
 * - Allows any status (user might mark incomplete data as 'processing')
 * 
 * OCR Upload:
 * - Ignores user status selection (confidence algorithm takes precedence)
 * - Uses confidence-based algorithm:
 *   - >= 70% confidence → 'completed'
 *   - < 70% confidence → 'pending_review'
 * - Business card uploads start as 'processing' then get updated via OCR job
 * 
 * Status State Machine:
 * - processing → completed (high confidence OCR)
 * - processing → pending_review (low confidence OCR)
 * - processing → failed (OCR failure)
 * - pending_review → user_verified (user approves)
 * - user_verified → [terminal state]
 * - completed → user_verified (user can manually verify)
 */
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

    // Map database fields to frontend expected format
    return results.map(contact => mapContactDbToApi(contact));
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

    return mapContactDbToApi(result[0]);
  }

  async create(data: CreateContactInput) {
    console.log('CREATE CONTACT CALLED with data:', JSON.stringify(data, null, 2));
    
    // For OCR-based creation, determine status by confidence
    let statusOverride: ContactStatus | undefined;
    
    if (data.ocr_confidence !== undefined) {
      statusOverride = data.ocr_confidence >= this.REVIEW_CONFIDENCE_THRESHOLD 
        ? 'completed' 
        : 'pending_review';
    }
    // For manual creation, let database default handle it or use user input

    // Convert API data to database format
    const apiDataForMapping: any = {
      event_id: data.event_id,
      full_name: data.full_name,
      email: data.email,
      company: data.company,
      title: data.title,
      phone: data.phone,
      linkedin_url: data.linkedin_url,
      business_card_url: data.business_card_url,
      ocr_confidence: data.ocr_confidence,
      ocr_raw_data: data.ocr_raw_data,
      user_modified_fields: data.user_modified_fields || {},
      processed_at: data.ocr_confidence !== undefined ? new Date() : undefined,
    };
    
    // Only set status if we have an override or explicit user input
    if (statusOverride || data.status) {
      apiDataForMapping.status = statusOverride || data.status;
    }
    
    const dbData = mapContactApiToDb(apiDataForMapping);
    
    console.log('DEBUG: Final dbData being inserted:', JSON.stringify(dbData, null, 2));

    // Ensure ocr_confidence is stored as string in database
    if (dbData.ocrConfidence !== undefined) {
      dbData.ocrConfidence = dbData.ocrConfidence.toString();
    }

    const [newContact] = await db
      .insert(contacts)
      .values(dbData)
      .returning();

    // Log activity
    await this.logActivity('contact_created', 'contact', newContact.id, {
      event_id: data.event_id,
      status: newContact.status,
      ocr_confidence: data.ocr_confidence,
      user_modified_fields: data.user_modified_fields,
    });

    return mapContactDbToApi(newContact);
  }

  async update(id: number, data: UpdateContactInput) {
    // Get existing contact from database without mapping (to avoid recursion)
    const existingResult = await db
      .select()
      .from(contacts)
      .where(eq(contacts.id, id))
      .limit(1);

    if (!existingResult[0]) {
      throw new Error(`Contact with id ${id} not found`);
    }

    const existing = existingResult[0];

    // Track if this is a user verification
    const isUserVerification = 
      existing.status === 'pending_review' && 
      data.status === 'user_verified';

    // Determine which fields have been modified by user
    const userModifiedFields = { ...(existing.userModifiedFields || {}) };
    const fieldMappings = {
      'full_name': 'fullName',
      'email': 'email',
      'company': 'company', 
      'title': 'title',
      'phone': 'phone',
      'linkedin_url': 'linkedinUrl'
    };

    // Mark fields as user-modified if they're being changed from OCR processing
    // Only mark as user-modified if this is a manual update (not from OCR)
    const isOcrUpdate = data.ocr_confidence !== undefined;
    if (!isOcrUpdate) {
      Object.entries(fieldMappings).forEach(([userField]) => {
        if (data[userField as keyof UpdateContactInput] !== undefined) {
          (userModifiedFields as any)[userField] = true;
        }
      });
    }

    const apiDataForMapping: any = {
      event_id: data.event_id,
      full_name: data.full_name,
      email: data.email,
      company: data.company,
      title: data.title,
      phone: data.phone,
      linkedin_url: data.linkedin_url,
      business_card_url: data.business_card_url,
      ocr_confidence: data.ocr_confidence,
      ocr_raw_data: data.ocr_raw_data,
      user_modified_fields: userModifiedFields,
      status: data.status,
      updated_at: new Date(),
    };

    if (isUserVerification) {
      apiDataForMapping.reviewed_at = new Date();
    }

    const dbData = mapContactApiToDb(apiDataForMapping);

    // Ensure ocr_confidence is stored as string in database
    if (dbData.ocrConfidence !== undefined) {
      dbData.ocrConfidence = dbData.ocrConfidence.toString();
    }

    // Remove undefined values from the final database object
    Object.keys(dbData).forEach(key => {
      if ((dbData as any)[key] === undefined) {
        delete (dbData as any)[key];
      }
    });

    const [updated] = await db
      .update(contacts)
      .set(dbData)
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
        userModifiedFields: userModifiedFields,
        wasOcrUpdate: isOcrUpdate,
      }
    );

    return mapContactDbToApi(updated);
  }

  async delete(id: number) {
    // Get existing contact from database without mapping (to avoid recursion)
    const existingResult = await db
      .select()
      .from(contacts)
      .where(eq(contacts.id, id))
      .limit(1);

    if (!existingResult[0]) {
      throw new Error(`Contact with id ${id} not found`);
    }

    const existing = existingResult[0];

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

    return updated.map(contact => mapContactDbToApi(contact));
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

    return mapContactDbToApi(updated);
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