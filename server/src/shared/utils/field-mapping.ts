/**
 * Centralized field mapping between database (camelCase) and API (snake_case)
 * This eliminates the recurring snake/camel case issues by providing
 * a single source of truth for field conversions.
 */

// Database field names (camelCase) -> API field names (snake_case)
export const DB_TO_API_MAPPING = {
  // Contact fields
  id: 'id',
  eventId: 'event_id',
  fullName: 'full_name',
  email: 'email',
  company: 'company',
  title: 'title',
  phone: 'phone',
  linkedinUrl: 'linkedin_url',
  businessCardUrl: 'business_card_url',
  ocrConfidence: 'ocr_confidence',
  ocrRawData: 'ocr_raw_data',
  userModifiedFields: 'user_modified_fields',
  status: 'status',
  processedAt: 'processed_at',
  reviewedAt: 'reviewed_at',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  
  // OCR Job fields
  contactId: 'contact_id',
  errorMessage: 'error_message',
  startedAt: 'started_at',
  completedAt: 'completed_at',
  
  // Activity Log fields
  entityType: 'entity_type',
  entityId: 'entity_id',
  
  // Event fields
  eventName: 'event_name',
  eventDate: 'event_date',
  eventLocation: 'event_location',
} as const;

// API field names (snake_case) -> Database field names (camelCase)
export const API_TO_DB_MAPPING = Object.fromEntries(
  Object.entries(DB_TO_API_MAPPING).map(([db, api]) => [api, db])
) as Record<string, string>;

/**
 * Convert database object (camelCase) to API object (snake_case)
 */
export function mapDbToApi<T extends Record<string, any>>(dbObject: T): Record<string, any> {
  if (!dbObject || typeof dbObject !== 'object') {
    return dbObject;
  }

  const apiObject: Record<string, any> = {};
  
  for (const [dbKey, value] of Object.entries(dbObject)) {
    const apiKey = DB_TO_API_MAPPING[dbKey as keyof typeof DB_TO_API_MAPPING] || dbKey;
    
    // Handle nested objects and arrays
    if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      apiObject[apiKey] = mapDbToApi(value);
    } else {
      apiObject[apiKey] = value;
    }
  }
  
  return apiObject;
}

/**
 * Convert API object (snake_case) to database object (camelCase)
 */
export function mapApiToDb<T extends Record<string, any>>(apiObject: T): Record<string, any> {
  if (!apiObject || typeof apiObject !== 'object') {
    return apiObject;
  }

  const dbObject: Record<string, any> = {};
  
  for (const [apiKey, value] of Object.entries(apiObject)) {
    const dbKey = API_TO_DB_MAPPING[apiKey] || apiKey;
    
    // Handle nested objects and arrays
    if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      dbObject[dbKey] = mapApiToDb(value);
    } else {
      dbObject[dbKey] = value;
    }
  }
  
  return dbObject;
}

/**
 * Convert database contact to API contact format
 */
export function mapContactDbToApi(contact: any): any {
  return {
    id: contact.id,
    event_id: contact.eventId,
    full_name: contact.fullName,
    email: contact.email,
    company: contact.company,
    title: contact.title,
    phone: contact.phone,
    linkedin_url: contact.linkedinUrl,
    business_card_url: contact.businessCardUrl,
    ocr_confidence: contact.ocrConfidence ? parseFloat(contact.ocrConfidence) : null,
    ocr_raw_data: contact.ocrRawData,
    user_modified_fields: contact.userModifiedFields || {},
    status: contact.status,
    processed_at: contact.processedAt,
    reviewed_at: contact.reviewedAt,
    created_at: contact.createdAt,
    updated_at: contact.updatedAt,
  };
}

/**
 * Convert API contact update to database format
 */
export function mapContactApiToDb(apiData: any): any {
  const dbData: any = {};
  
  if (apiData.event_id !== undefined) dbData.eventId = apiData.event_id;
  if (apiData.full_name !== undefined) dbData.fullName = apiData.full_name;
  if (apiData.email !== undefined) dbData.email = apiData.email;
  if (apiData.company !== undefined) dbData.company = apiData.company;
  if (apiData.title !== undefined) dbData.title = apiData.title;
  if (apiData.phone !== undefined) dbData.phone = apiData.phone;
  if (apiData.linkedin_url !== undefined) dbData.linkedinUrl = apiData.linkedin_url;
  if (apiData.business_card_url !== undefined) dbData.businessCardUrl = apiData.business_card_url;
  if (apiData.ocr_confidence !== undefined) dbData.ocrConfidence = apiData.ocr_confidence?.toString();
  if (apiData.ocr_raw_data !== undefined) dbData.ocrRawData = apiData.ocr_raw_data;
  if (apiData.user_modified_fields !== undefined) dbData.userModifiedFields = apiData.user_modified_fields;
  if (apiData.status !== undefined) dbData.status = apiData.status;
  if (apiData.processed_at !== undefined) dbData.processedAt = apiData.processed_at;
  if (apiData.reviewed_at !== undefined) dbData.reviewedAt = apiData.reviewed_at;
  if (apiData.updated_at !== undefined) dbData.updatedAt = apiData.updated_at;
  
  return dbData;
}

/**
 * Type-safe field mapping for specific use cases
 */
export const CONTACT_FIELD_MAPPINGS = {
  db_to_api: {
    fullName: 'full_name',
    businessCardUrl: 'business_card_url',
    linkedinUrl: 'linkedin_url',
    userModifiedFields: 'user_modified_fields',
    ocrConfidence: 'ocr_confidence',
    ocrRawData: 'ocr_raw_data',
  },
  api_to_db: {
    full_name: 'fullName',
    business_card_url: 'businessCardUrl',
    linkedin_url: 'linkedinUrl',
    user_modified_fields: 'userModifiedFields',
    ocr_confidence: 'ocrConfidence',
    ocr_raw_data: 'ocrRawData',
  }
} as const;