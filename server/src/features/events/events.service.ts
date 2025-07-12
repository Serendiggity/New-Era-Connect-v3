import { eq } from 'drizzle-orm';
import { db } from '../../shared/db/connection.js';
import { events } from '../../shared/db/schema.js';
import { CreateEventInput } from '@business-card-manager/shared';

export interface CreateEventData {
  name: string;
  date: string;
  location?: string;
  industry?: string;
  description?: string;
}

export class EventsService {
  static async getAll() {
    return await db.select().from(events).orderBy(events.created_at);
  }

  static async getById(id: number) {
    const result = await db.select().from(events).where(eq(events.id, id));
    return result[0] || null;
  }

  static async create(data: CreateEventData) {
    const result = await db.insert(events).values({
      name: data.name,
      date: data.date,
      location: data.location,
      industry: data.industry,
      description: data.description,
    }).returning();
    
    return result[0];
  }

  static async update(id: number, data: Partial<CreateEventData>) {
    const result = await db
      .update(events)
      .set({ 
        ...data, 
        updated_at: new Date() 
      })
      .where(eq(events.id, id))
      .returning();
    
    return result[0] || null;
  }

  static async delete(id: number) {
    const result = await db.delete(events).where(eq(events.id, id)).returning();
    return result[0] || null;
  }
}