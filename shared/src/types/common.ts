export type ID = number;
export type Timestamp = string; // ISO 8601 date string

export interface BaseEntity {
  id: ID;
  created_at: Timestamp;
  updated_at?: Timestamp;
}

export interface ApiResponse<T> {
  data: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ValidationError {
  field: string;
  message: string;
}