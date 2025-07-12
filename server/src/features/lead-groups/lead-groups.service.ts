import { db } from '../../shared/db/connection.js';
import { leadGroups, leadGroupContacts, contacts, activityLogs } from '../../shared/db/schema.js';
import { eq, and, or, like, desc, sql, inArray } from 'drizzle-orm';
import { z } from 'zod';

// Validation schemas
export const CreateLeadGroupSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
});

export const UpdateLeadGroupSchema = CreateLeadGroupSchema.partial().extend({
  id: z.number(),
});

export const LeadGroupFiltersSchema = z.object({
  search: z.string().optional(),
});

export const AssignContactsSchema = z.object({
  contact_ids: z.array(z.number()).min(1),
});

export type CreateLeadGroupInput = z.infer<typeof CreateLeadGroupSchema>;
export type UpdateLeadGroupInput = z.infer<typeof UpdateLeadGroupSchema>;
export type LeadGroupFilters = z.infer<typeof LeadGroupFiltersSchema>;
export type AssignContactsInput = z.infer<typeof AssignContactsSchema>;

// Service class
export class LeadGroupsService {
  private readonly userId = 1; // Hard-coded for single-user MVP

  async findAll(filters: LeadGroupFilters) {
    const conditions = [];

    if (filters.search) {
      const searchPattern = `%${filters.search}%`;
      conditions.push(
        or(
          like(leadGroups.name, searchPattern),
          like(leadGroups.description, searchPattern)
        )
      );
    }

    const query = conditions.length > 0 
      ? db.select().from(leadGroups).where(and(...conditions))
      : db.select().from(leadGroups);

    const groups = await query.orderBy(desc(leadGroups.createdAt));

    // Get contact counts for each group
    const groupsWithCounts = await Promise.all(
      groups.map(async (group) => {
        const contactCount = await this.getGroupContactCount(group.id);
        return {
          ...group,
          contact_count: contactCount,
        };
      })
    );

    // Log activity
    await this.logActivity('lead_groups_listed', 'lead_group', null, { filters });

    return groupsWithCounts;
  }

  async findById(id: number) {
    const result = await db
      .select()
      .from(leadGroups)
      .where(eq(leadGroups.id, id))
      .limit(1);

    if (!result[0]) {
      throw new Error(`Lead group with id ${id} not found`);
    }

    return result[0];
  }

  async findByIdWithContacts(id: number) {
    const group = await this.findById(id);

    // Get contacts in this group
    const groupContacts = await db
      .select({
        contact: contacts,
        addedAt: leadGroupContacts.addedAt,
      })
      .from(leadGroupContacts)
      .innerJoin(contacts, eq(leadGroupContacts.contactId, contacts.id))
      .where(eq(leadGroupContacts.leadGroupId, id))
      .orderBy(desc(leadGroupContacts.addedAt));

    return {
      ...group,
      contacts: groupContacts.map(gc => ({
        ...gc.contact,
        added_at: gc.addedAt,
      })),
      contact_count: groupContacts.length,
    };
  }

  async create(data: CreateLeadGroupInput) {
    const [newGroup] = await db
      .insert(leadGroups)
      .values({
        name: data.name,
        description: data.description,
      })
      .returning();

    // Log activity
    await this.logActivity('lead_group_created', 'lead_group', newGroup.id, {
      name: data.name,
      description: data.description,
    });

    return {
      ...newGroup,
      contact_count: 0,
    };
  }

  async update(id: number, data: UpdateLeadGroupInput) {
    const existing = await this.findById(id);

    const updateData: any = {
      name: data.name,
      description: data.description,
      updatedAt: new Date(),
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const [updated] = await db
      .update(leadGroups)
      .set(updateData)
      .where(eq(leadGroups.id, id))
      .returning();

    // Log activity
    await this.logActivity('lead_group_updated', 'lead_group', id, {
      changes: data,
      previousName: existing.name,
    });

    const contactCount = await this.getGroupContactCount(id);

    return {
      ...updated,
      contact_count: contactCount,
    };
  }

  async delete(id: number) {
    const existing = await this.findById(id);
    const contactCount = await this.getGroupContactCount(id);

    // Delete group (contacts will be automatically removed via cascade)
    await db.delete(leadGroups).where(eq(leadGroups.id, id));

    // Log activity
    await this.logActivity('lead_group_deleted', 'lead_group', id, {
      deletedGroup: existing,
      contactCount,
    });
  }

  async duplicate(id: number, newName: string) {
    const originalGroup = await this.findByIdWithContacts(id);

    // Create new group
    const duplicateData = {
      name: newName,
      description: originalGroup.description 
        ? `${originalGroup.description} (Copy)` 
        : 'Copy of ' + originalGroup.name,
    };

    const [newGroup] = await db
      .insert(leadGroups)
      .values(duplicateData)
      .returning();

    // Copy contact associations
    if (originalGroup.contacts.length > 0) {
      const contactAssociations = originalGroup.contacts.map(contact => ({
        leadGroupId: newGroup.id,
        contactId: contact.id,
      }));

      await db.insert(leadGroupContacts).values(contactAssociations);
    }

    // Log activity
    await this.logActivity('lead_group_duplicated', 'lead_group', newGroup.id, {
      originalGroupId: id,
      originalGroupName: originalGroup.name,
      newGroupName: newName,
      contactCount: originalGroup.contacts.length,
    });

    return {
      ...newGroup,
      contact_count: originalGroup.contacts.length,
    };
  }

  async assignContacts(groupId: number, contactIds: number[]) {
    const group = await this.findById(groupId);

    // Check which contacts exist
    const existingContacts = await db
      .select({ id: contacts.id })
      .from(contacts)
      .where(inArray(contacts.id, contactIds));

    const existingContactIds = existingContacts.map(c => c.id);
    const nonExistentIds = contactIds.filter(id => !existingContactIds.includes(id));

    if (nonExistentIds.length > 0) {
      throw new Error(`Contacts not found: ${nonExistentIds.join(', ')}`);
    }

    // Check which contacts are already in the group
    const existingAssignments = await db
      .select({ contactId: leadGroupContacts.contactId })
      .from(leadGroupContacts)
      .where(
        and(
          eq(leadGroupContacts.leadGroupId, groupId),
          inArray(leadGroupContacts.contactId, contactIds)
        )
      );

    const alreadyAssignedIds = existingAssignments.map(a => a.contactId);
    const newAssignmentIds = contactIds.filter(id => !alreadyAssignedIds.includes(id));

    if (newAssignmentIds.length === 0) {
      return { 
        assigned: 0, 
        skipped: alreadyAssignedIds.length,
        message: 'All contacts were already assigned to this group' 
      };
    }

    // Create new assignments
    const assignments = newAssignmentIds.map(contactId => ({
      leadGroupId: groupId,
      contactId,
    }));

    await db.insert(leadGroupContacts).values(assignments);

    // Log activity
    await this.logActivity('contacts_assigned_to_group', 'lead_group', groupId, {
      groupName: group.name,
      contactIds: newAssignmentIds,
      assigned: newAssignmentIds.length,
      skipped: alreadyAssignedIds.length,
    });

    return {
      assigned: newAssignmentIds.length,
      skipped: alreadyAssignedIds.length,
      message: `Assigned ${newAssignmentIds.length} contacts to group`
    };
  }

  async removeContacts(groupId: number, contactIds: number[]) {
    const group = await this.findById(groupId);

    const result = await db
      .delete(leadGroupContacts)
      .where(
        and(
          eq(leadGroupContacts.leadGroupId, groupId),
          inArray(leadGroupContacts.contactId, contactIds)
        )
      )
      .returning();

    // Log activity
    await this.logActivity('contacts_removed_from_group', 'lead_group', groupId, {
      groupName: group.name,
      contactIds,
      removed: result.length,
    });

    return {
      removed: result.length,
      message: `Removed ${result.length} contacts from group`
    };
  }

  async getContactsNotInGroup(groupId: number, search?: string) {
    // First, get all contact IDs that are in this group
    const contactsInGroup = await db
      .select({ contactId: leadGroupContacts.contactId })
      .from(leadGroupContacts)
      .where(eq(leadGroupContacts.leadGroupId, groupId));

    const contactIdsInGroup = contactsInGroup.map(c => c.contactId);

    // Build the query for contacts NOT in this group
    let query = db.select().from(contacts);
    const conditions = [];

    // Exclude contacts that are already in the group
    if (contactIdsInGroup.length > 0) {
      conditions.push(sql`${contacts.id} NOT IN (${contactIdsInGroup.join(',')})`);
    }

    // Add search filter if provided
    if (search) {
      const searchPattern = `%${search}%`;
      conditions.push(
        or(
          like(contacts.fullName, searchPattern),
          like(contacts.email, searchPattern),
          like(contacts.company, searchPattern),
          like(contacts.title, searchPattern)
        )
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const availableContacts = await query
      .orderBy(desc(contacts.createdAt))
      .limit(50); // Limit for performance

    return availableContacts;
  }

  async getGroupStats() {
    const totalGroups = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(leadGroups);

    const totalAssignments = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(leadGroupContacts);

    // Get group sizes distribution
    const groupSizes = await db
      .select({
        groupId: leadGroupContacts.leadGroupId,
        contactCount: sql<number>`count(*)::int`,
      })
      .from(leadGroupContacts)
      .groupBy(leadGroupContacts.leadGroupId);

    const emptyGroupsCount = (totalGroups[0]?.count || 0) - groupSizes.length;

    return {
      totalGroups: totalGroups[0]?.count || 0,
      totalAssignments: totalAssignments[0]?.count || 0,
      emptyGroups: emptyGroupsCount,
      averageSize: groupSizes.length > 0 
        ? Math.round((totalAssignments[0]?.count || 0) / groupSizes.length * 100) / 100
        : 0,
    };
  }

  private async getGroupContactCount(groupId: number): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(leadGroupContacts)
      .where(eq(leadGroupContacts.leadGroupId, groupId));

    return result[0]?.count || 0;
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
export const leadGroupsService = new LeadGroupsService();