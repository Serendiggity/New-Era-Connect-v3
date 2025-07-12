import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../shared/api/client';
import type { Contact, CreateContactInput, UpdateContactInput, ContactStatus } from '../../../../../shared/src/types/contact';

export interface ContactFilters {
  eventId?: number;
  status?: ContactStatus;
  search?: string;
  needsReview?: boolean;
}

export interface ContactStats {
  total: number;
  byStatus: Record<string, number>;
  needsReview: number;
}

// Query keys
export const contactsKeys = {
  all: ['contacts'] as const,
  lists: () => [...contactsKeys.all, 'list'] as const,
  list: (filters?: ContactFilters) => [...contactsKeys.lists(), filters] as const,
  details: () => [...contactsKeys.all, 'detail'] as const,
  detail: (id: number) => [...contactsKeys.details(), id] as const,
  stats: () => [...contactsKeys.all, 'stats'] as const,
};

// API functions
const contactsApi = {
  getAll: async (filters?: ContactFilters): Promise<Contact[]> => {
    const params = new URLSearchParams();
    if (filters?.eventId) params.append('eventId', filters.eventId.toString());
    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.needsReview !== undefined) params.append('needsReview', filters.needsReview.toString());
    
    const { data } = await apiClient.get<Contact[]>(`/api/contacts?${params}`);
    return data;
  },

  getById: async (id: number): Promise<Contact> => {
    const { data } = await apiClient.get<Contact>(`/api/contacts/${id}`);
    return data;
  },

  getStats: async (): Promise<ContactStats> => {
    const { data } = await apiClient.get<ContactStats>('/api/contacts/stats');
    return data;
  },

  create: async (input: CreateContactInput): Promise<Contact> => {
    const { data } = await apiClient.post<Contact>('/api/contacts', input);
    return data;
  },

  update: async ({ id, ...input }: UpdateContactInput & { id: number }): Promise<Contact> => {
    const { data } = await apiClient.put<Contact>(`/api/contacts/${id}`, input);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/contacts/${id}`);
  },

  bulkUpdateStatus: async (contactIds: number[], status: ContactStatus): Promise<{ updated: number; contacts: Contact[] }> => {
    const { data } = await apiClient.post<{ updated: number; contacts: Contact[] }>('/api/contacts/bulk-status', {
      contactIds,
      status,
    });
    return data;
  },

  processOcrResult: async (id: number, ocrData: any, confidence: number): Promise<Contact> => {
    const { data } = await apiClient.post<Contact>(`/api/contacts/${id}/ocr-result`, {
      ocrData,
      confidence,
    });
    return data;
  },
};

// React Query hooks
export function useContacts(filters?: ContactFilters) {
  return useQuery({
    queryKey: contactsKeys.list(filters),
    queryFn: () => contactsApi.getAll(filters),
  });
}

export function useContact(id: number) {
  return useQuery({
    queryKey: contactsKeys.detail(id),
    queryFn: () => contactsApi.getById(id),
    enabled: !!id,
  });
}

export function useContactStats() {
  return useQuery({
    queryKey: contactsKeys.stats(),
    queryFn: contactsApi.getStats,
  });
}

export function useCreateContact() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: contactsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: contactsKeys.stats() });
    },
  });
}

export function useUpdateContact() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: contactsApi.update,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: contactsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: contactsKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: contactsKeys.stats() });
    },
  });
}

export function useDeleteContact() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: contactsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: contactsKeys.stats() });
    },
  });
}

export function useBulkUpdateContactStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ contactIds, status }: { contactIds: number[]; status: ContactStatus }) =>
      contactsApi.bulkUpdateStatus(contactIds, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: contactsKeys.stats() });
    },
  });
}

export function useProcessOcrResult() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, ocrData, confidence }: { id: number; ocrData: any; confidence: number }) =>
      contactsApi.processOcrResult(id, ocrData, confidence),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: contactsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: contactsKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: contactsKeys.stats() });
    },
  });
}