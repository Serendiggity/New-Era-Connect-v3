import { Router } from 'express';
import multer from 'multer';
import { contactsService, CreateContactSchema, UpdateContactSchema, ContactFiltersSchema, ContactStatusEnum } from './contacts.service.js';
import { uploadService } from './upload.service.js';
import { ocrJobService } from './ocr-job.service.js';
import { z } from 'zod';

const router = Router();

// Configure multer for file uploads (memory storage)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`));
    }
  },
});

// GET /api/contacts - List all contacts with optional filters
router.get('/', async (req, res) => {
  try {
    const filters = ContactFiltersSchema.parse({
      eventId: req.query.eventId ? Number(req.query.eventId) : undefined,
      status: req.query.status,
      search: req.query.search,
      needsReview: req.query.needsReview === 'true',
    });

    const contacts = await contactsService.findAll(filters);
    res.json({ data: contacts });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid query parameters', details: error.errors });
    } else {
      console.error('Error fetching contacts:', error);
      res.status(500).json({ error: 'Failed to fetch contacts' });
    }
  }
});

// GET /api/contacts/stats - Get contact statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await contactsService.getStats();
    res.json({ data: stats });
  } catch (error) {
    console.error('Error fetching contact stats:', error);
    res.status(500).json({ error: 'Failed to fetch contact statistics' });
  }
});

// GET /api/contacts/:id - Get single contact
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid contact ID' });
    }

    const contact = await contactsService.findById(id);
    res.json({ data: contact });
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json({ error: error.message });
    } else {
      console.error('Error fetching contact:', error);
      res.status(500).json({ error: 'Failed to fetch contact' });
    }
  }
});

// POST /api/contacts - Create new contact
router.post('/', async (req, res) => {
  try {
    console.log('ROUTE: POST /contacts called with body:', JSON.stringify(req.body, null, 2));
    const data = CreateContactSchema.parse(req.body);
    console.log('ROUTE: Parsed data:', JSON.stringify(data, null, 2));
    const contact = await contactsService.create(data);
    res.status(201).json({ data: contact });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid contact data', details: error.errors });
    } else {
      console.error('Error creating contact:', error);
      res.status(500).json({ error: 'Failed to create contact' });
    }
  }
});

// PUT /api/contacts/:id - Update contact
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid contact ID' });
    }

    const data = UpdateContactSchema.parse({ ...req.body, id });
    const contact = await contactsService.update(id, data);
    res.json({ data: contact });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid contact data', details: error.errors });
    } else if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json({ error: error.message });
    } else {
      console.error('Error updating contact:', error);
      res.status(500).json({ error: 'Failed to update contact' });
    }
  }
});

// DELETE /api/contacts/:id - Delete contact
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid contact ID' });
    }

    await contactsService.delete(id);
    res.status(204).send();
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json({ error: error.message });
    } else {
      console.error('Error deleting contact:', error);
      res.status(500).json({ error: 'Failed to delete contact' });
    }
  }
});

// POST /api/contacts/bulk-status - Bulk update contact status
router.post('/bulk-status', async (req, res) => {
  try {
    const schema = z.object({
      contactIds: z.array(z.number()).min(1),
      status: ContactStatusEnum,
    });

    const { contactIds, status } = schema.parse(req.body);
    const updated = await contactsService.bulkUpdateStatus(contactIds, status);
    res.json({ data: { updated: updated.length, contacts: updated } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid request data', details: error.errors });
    } else {
      console.error('Error bulk updating contacts:', error);
      res.status(500).json({ error: 'Failed to update contacts' });
    }
  }
});

// POST /api/contacts/:id/ocr-result - Process OCR result for a contact
router.post('/:id/ocr-result', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid contact ID' });
    }

    const schema = z.object({
      ocrData: z.any(),
      confidence: z.number().min(0).max(1),
    });

    const { ocrData, confidence } = schema.parse(req.body);
    const contact = await contactsService.processOcrResult(id, ocrData, confidence);
    res.json({ data: contact });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid OCR data', details: error.errors });
    } else if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json({ error: error.message });
    } else {
      console.error('Error processing OCR result:', error);
      res.status(500).json({ error: 'Failed to process OCR result' });
    }
  }
});

// POST /api/contacts/upload - Upload business card image and create contact
router.post('/upload', upload.single('businessCard'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Validate additional contact data
    const contactDataSchema = z.object({
      event_id: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
      full_name: z.string().min(1).optional(),
    });

    const contactData = contactDataSchema.parse(req.body);

    // Prepare file for upload
    const uploadedFile = {
      originalName: req.file.originalname,
      filename: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      buffer: req.file.buffer,
    };

    // Upload file to Supabase Storage
    const uploadResult = await uploadService.uploadFile(uploadedFile);

    // Create contact with business card URL
    const contact = await contactsService.create({
      event_id: contactData.event_id,
      full_name: contactData.full_name || 'Processing...',
      business_card_url: uploadResult.url,
      status: 'processing',
    });

    // Create OCR job for processing
    const ocrJob = await ocrJobService.createJob({
      contact_id: contact.id,
      business_card_url: uploadResult.url,
    });

    // Start processing the OCR job asynchronously
    ocrJobService.processJob(ocrJob.id).catch(error => {
      console.error(`Failed to process OCR job ${ocrJob.id}:`, error);
    });

    res.status(201).json({
      data: {
        contact,
        upload: uploadResult,
        ocrJob,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid request data', details: error.errors });
    } else if (error instanceof Error && error.message.includes('File type')) {
      res.status(400).json({ error: error.message });
    } else {
      console.error('Error uploading business card:', error);
      res.status(500).json({ error: 'Failed to upload business card' });
    }
  }
});

// POST /api/contacts/:id/upload - Upload business card for existing contact
router.post('/:id/upload', upload.single('businessCard'), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid contact ID' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Check if contact exists
    const existingContact = await contactsService.findById(id);

    // Prepare file for upload
    const uploadedFile = {
      originalName: req.file.originalname,
      filename: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      buffer: req.file.buffer,
    };

    // Upload file to Supabase Storage
    const uploadResult = await uploadService.uploadFile(uploadedFile);

    // Update contact with business card URL
    const contact = await contactsService.update(id, {
      id: id,
      business_card_url: uploadResult.url,
      status: 'processing',
    });

    // Create OCR job for processing
    const ocrJob = await ocrJobService.createJob({
      contact_id: contact.id,
      business_card_url: uploadResult.url,
    });

    // Start processing the OCR job asynchronously
    ocrJobService.processJob(ocrJob.id).catch(error => {
      console.error(`Failed to process OCR job ${ocrJob.id}:`, error);
    });

    res.json({
      data: {
        contact,
        upload: uploadResult,
        ocrJob,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json({ error: error.message });
    } else if (error instanceof Error && error.message.includes('File type')) {
      res.status(400).json({ error: error.message });
    } else {
      console.error('Error uploading business card:', error);
      res.status(500).json({ error: 'Failed to upload business card' });
    }
  }
});

// GET /api/contacts/:id/ocr-jobs - Get OCR jobs for a contact
router.get('/:id/ocr-jobs', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid contact ID' });
    }

    const jobs = await ocrJobService.findByContactId(id);
    res.json({ data: jobs });
  } catch (error) {
    console.error('Error fetching OCR jobs:', error);
    res.status(500).json({ error: 'Failed to fetch OCR jobs' });
  }
});

// POST /api/contacts/process-pending-ocr - Process all pending OCR jobs
router.post('/process-pending-ocr', async (req, res) => {
  try {
    const result = await ocrJobService.processPendingJobs();
    res.json({ data: result });
  } catch (error) {
    console.error('Error processing pending OCR jobs:', error);
    res.status(500).json({ error: 'Failed to process pending OCR jobs' });
  }
});

export { router as contactsRouter };