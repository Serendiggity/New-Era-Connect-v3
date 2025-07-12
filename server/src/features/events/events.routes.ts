import { Router } from 'express';
import { z } from 'zod';
import { Event, CreateEventInput } from '@business-card-manager/shared';
import { logActivity } from '../../shared/middleware/activity-logger.js';
import { EventsService } from './events.service.js';

const router = Router();

// Validation schemas
const createEventSchema = z.object({
  name: z.string().min(1).max(255),
  date: z.string().datetime(),
  location: z.string().max(255).optional(),
  industry: z.string().max(100).optional(),
  description: z.string().optional(),
});
const updateEventSchema = createEventSchema.partial();

// GET /api/events
router.get('/', async (req, res) => {
  const events = await EventsService.getAll();
  res.json({ data: events });
});

// GET /api/events/:id
router.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const event = await EventsService.getById(id);
  
  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }
  
  res.json({ data: event });
});

// POST /api/events
router.post('/', async (req, res) => {
  const validatedData = createEventSchema.parse(req.body);
  
  const newEvent = await EventsService.create(validatedData);
  
  await logActivity('event_created', 'event', newEvent.id, {
    name: newEvent.name,
  });
  
  res.status(201).json({ data: newEvent });
});

// PUT /api/events/:id
router.put('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const validatedData = updateEventSchema.parse(req.body);
  const updatedEvent = await EventsService.update(id, validatedData);
  if (!updatedEvent) {
    return res.status(404).json({ error: 'Event not found' });
  }
  await logActivity('event_updated', 'event', updatedEvent.id, {
    name: updatedEvent.name,
  });
  res.json({ data: updatedEvent });
});

// DELETE /api/events/:id
router.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const deletedEvent = await EventsService.delete(id);
  if (!deletedEvent) {
    return res.status(404).json({ error: 'Event not found' });
  }
  await logActivity('event_deleted', 'event', deletedEvent.id, {
    name: deletedEvent.name,
  });
  res.status(204).send();
});

export { router as eventsRouter };