import { Router } from 'express';
import { contactsService, CreateContactSchema, UpdateContactSchema, ContactFiltersSchema, ContactStatusEnum } from './contacts.service.js';
import { z } from 'zod';

const router = Router();

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
    const data = CreateContactSchema.parse(req.body);
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

export { router as contactsRouter };