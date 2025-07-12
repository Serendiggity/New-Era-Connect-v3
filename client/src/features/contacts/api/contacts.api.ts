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

  uploadBusinessCard: async (file: File, contactData?: { event_id?: number; full_name?: string }): Promise<{
    contact: Contact;
    upload: { url: string; filename: string; originalName: string; size: number };
    ocrJob: { id: number; contactId: number; status: string };
  }> => {
    const formData = new FormData();
    formData.append('businessCard', file);
    
    if (contactData?.event_id) {
      formData.append('event_id', contactData.event_id.toString());
    }
    if (contactData?.full_name) {
      formData.append('full_name', contactData.full_name);
    }

    const { data } = await apiClient.post('/api/contacts/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },

  uploadBusinessCardForContact: async (contactId: number, file: File): Promise<{
    contact: Contact;
    upload: { url: string; filename: string; originalName: string; size: number };
    ocrJob: { id: number; contactId: number; status: string };
  }> => {
    const formData = new FormData();
    formData.append('businessCard', file);

    const { data } = await apiClient.post(`/api/contacts/${contactId}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },

  getOcrJobs: async (contactId: number): Promise<Array<{
    id: number;
    contactId: number;
    status: string;
    errorMessage?: string;
    startedAt?: string;
    completedAt?: string;
    createdAt: string;
  }>> => {
    const { data } = await apiClient.get(`/api/contacts/${contactId}/ocr-jobs`);
    return data;
  },

  processPendingOcrJobs: async (): Promise<{ processed: number; failed: number }> => {
    const { data } = await apiClient.post('/api/contacts/process-pending-ocr');
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

export function useUploadBusinessCard() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ file, contactData }: { file: File; contactData?: { event_id?: number; full_name?: string } }) =>
      contactsApi.uploadBusinessCard(file, contactData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: contactsKeys.stats() });
    },
  });
}

export function useUploadBusinessCardForContact() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ contactId, file }: { contactId: number; file: File }) =>
      contactsApi.uploadBusinessCardForContact(contactId, file),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: contactsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: contactsKeys.detail(data.contact.id) });
      queryClient.invalidateQueries({ queryKey: contactsKeys.stats() });
    },
  });
}

export function useOcrJobs(contactId: number) {
  return useQuery({
    queryKey: [...contactsKeys.detail(contactId), 'ocr-jobs'],
    queryFn: () => contactsApi.getOcrJobs(contactId),
    enabled: !!contactId,
  });
}

export function useProcessPendingOcrJobs() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: contactsApi.processPendingOcrJobs,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: contactsKeys.stats() });
    },
  });
}