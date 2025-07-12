import { Router } from 'express';
import { 
  leadGroupsService, 
  CreateLeadGroupSchema, 
  UpdateLeadGroupSchema,
  LeadGroupFiltersSchema,
  AssignContactsSchema 
} from './lead-groups.service.js';
import { errorHandler } from '../../shared/middleware/error-handler.js';
import { z } from 'zod';

const router = Router();

// GET /api/lead-groups - List all lead groups with optional filtering
router.get('/', errorHandler(async (req, res) => {
  const filters = LeadGroupFiltersSchema.parse(req.query);
  const groups = await leadGroupsService.findAll(filters);
  res.json(groups);
}));

// GET /api/lead-groups/stats - Get lead group statistics
router.get('/stats', errorHandler(async (req, res) => {
  const stats = await leadGroupsService.getGroupStats();
  res.json(stats);
}));

// GET /api/lead-groups/:id - Get specific lead group
router.get('/:id', errorHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid lead group ID' });
  }

  const group = await leadGroupsService.findById(id);
  res.json(group);
}));

// GET /api/lead-groups/:id/details - Get lead group with contacts
router.get('/:id/details', errorHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid lead group ID' });
  }

  const groupWithContacts = await leadGroupsService.findByIdWithContacts(id);
  res.json(groupWithContacts);
}));

// GET /api/lead-groups/:id/available-contacts - Get contacts not in this group
router.get('/:id/available-contacts', errorHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid lead group ID' });
  }

  const searchSchema = z.object({
    search: z.string().optional(),
  });

  const { search } = searchSchema.parse(req.query);
  const availableContacts = await leadGroupsService.getContactsNotInGroup(id, search);
  res.json(availableContacts);
}));

// POST /api/lead-groups - Create new lead group
router.post('/', errorHandler(async (req, res) => {
  const data = CreateLeadGroupSchema.parse(req.body);
  const newGroup = await leadGroupsService.create(data);
  res.status(201).json(newGroup);
}));

// POST /api/lead-groups/:id/duplicate - Duplicate lead group
router.post('/:id/duplicate', errorHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid lead group ID' });
  }

  const duplicateSchema = z.object({
    name: z.string().min(1).max(255),
  });

  const { name } = duplicateSchema.parse(req.body);
  const duplicatedGroup = await leadGroupsService.duplicate(id, name);
  res.status(201).json(duplicatedGroup);
}));

// PUT /api/lead-groups/:id - Update lead group
router.put('/:id', errorHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid lead group ID' });
  }

  const data = UpdateLeadGroupSchema.parse({ ...req.body, id });
  const updatedGroup = await leadGroupsService.update(id, data);
  res.json(updatedGroup);
}));

// DELETE /api/lead-groups/:id - Delete lead group
router.delete('/:id', errorHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid lead group ID' });
  }

  await leadGroupsService.delete(id);
  res.status(204).send();
}));

// POST /api/lead-groups/:id/contacts - Assign contacts to group
router.post('/:id/contacts', errorHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid lead group ID' });
  }

  const { contact_ids } = AssignContactsSchema.parse(req.body);
  const result = await leadGroupsService.assignContacts(id, contact_ids);
  res.json(result);
}));

// DELETE /api/lead-groups/:id/contacts - Remove contacts from group
router.delete('/:id/contacts', errorHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid lead group ID' });
  }

  const { contact_ids } = AssignContactsSchema.parse(req.body);
  const result = await leadGroupsService.removeContacts(id, contact_ids);
  res.json(result);
}));

// Bulk operations
// POST /api/lead-groups/bulk/assign - Assign multiple contacts to multiple groups
router.post('/bulk/assign', errorHandler(async (req, res) => {
  const bulkAssignSchema = z.object({
    group_ids: z.array(z.number()).min(1),
    contact_ids: z.array(z.number()).min(1),
  });

  const { group_ids, contact_ids } = bulkAssignSchema.parse(req.body);
  
  const results = [];
  for (const groupId of group_ids) {
    try {
      const result = await leadGroupsService.assignContacts(groupId, contact_ids);
      results.push({ group_id: groupId, ...result });
    } catch (error) {
      results.push({ 
        group_id: groupId, 
        error: error instanceof Error ? error.message : 'Unknown error',
        assigned: 0,
        skipped: 0
      });
    }
  }

  const totalAssigned = results.reduce((sum, r) => sum + (r.assigned || 0), 0);
  const totalSkipped = results.reduce((sum, r) => sum + (r.skipped || 0), 0);

  res.json({
    results,
    summary: {
      total_assigned: totalAssigned,
      total_skipped: totalSkipped,
      groups_processed: group_ids.length,
      contacts_processed: contact_ids.length,
    }
  });
}));

export default router;