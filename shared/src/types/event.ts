import { BaseEntity } from './common.js';

export interface Event extends BaseEntity {
  name: string;
  date: string; // ISO date string
  location?: string;
  industry?: string;
  description?: string;
}

export interface CreateEventInput {
  name: string;
  date: string;
  location?: string;
  industry?: string;
  description?: string;
}

export interface UpdateEventInput extends Partial<CreateEventInput> {}