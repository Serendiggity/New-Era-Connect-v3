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

export { router as eventsRouter };