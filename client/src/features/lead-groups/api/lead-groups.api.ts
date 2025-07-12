import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../shared/api/client';

// Types
export interface LeadGroup {
  id: number;
  name: string;
  description?: string;
  contact_count: number;
  createdAt: string;
  updatedAt: string;
}

export interface LeadGroupWithContacts extends LeadGroup {
  contacts: Contact[];
}

export interface Contact {
  id: number;
  eventId?: number;
  fullName: string;
  email?: string;
  company?: string;
  title?: string;
  phone?: string;
  linkedinUrl?: string;
  businessCardUrl?: string;
  ocrConfidence?: string;
  ocrRawData?: any;
  status: string;
  processedAt?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
  added_at?: string; // For contacts in groups
}

export interface CreateLeadGroupInput {
  name: string;
  description?: string;
}

export interface UpdateLeadGroupInput {
  name?: string;
  description?: string;
}

export interface LeadGroupStats {
  totalGroups: number;
  totalAssignments: number;
  emptyGroups: number;
  averageSize: number;
}

export interface AssignContactsInput {
  contact_ids: number[];
}

export interface AssignmentResult {
  assigned: number;
  skipped: number;
  message: string;
}

export interface BulkAssignInput {
  group_ids: number[];
  contact_ids: number[];
}

export interface BulkAssignResult {
  results: Array<{
    group_id: number;
    assigned?: number;
    skipped?: number;
    error?: string;
  }>;
  summary: {
    total_assigned: number;
    total_skipped: number;
    groups_processed: number;
    contacts_processed: number;
  };
}

// Query keys
export const leadGroupsKeys = {
  all: ['lead-groups'] as const,
  lists: () => [...leadGroupsKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...leadGroupsKeys.lists(), filters] as const,
  details: () => [...leadGroupsKeys.all, 'detail'] as const,
  detail: (id: number) => [...leadGroupsKeys.details(), id] as const,
  detailWithContacts: (id: number) => [...leadGroupsKeys.details(), id, 'contacts'] as const,
  stats: () => [...leadGroupsKeys.all, 'stats'] as const,
  availableContacts: (id: number, search?: string) => 
    [...leadGroupsKeys.all, 'available-contacts', id, search] as const,
};

// API functions
export const leadGroupsApi = {
  getAll: async (filters: { search?: string } = {}): Promise<LeadGroup[]> => {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    
    const response = await apiClient.get(`/lead-groups?${params.toString()}`);
    return response.data;
  },

  getStats: async (): Promise<LeadGroupStats> => {
    const response = await apiClient.get('/lead-groups/stats');
    return response.data;
  },

  getById: async (id: number): Promise<LeadGroup> => {
    const response = await apiClient.get(`/lead-groups/${id}`);
    return response.data;
  },

  getByIdWithContacts: async (id: number): Promise<LeadGroupWithContacts> => {
    const response = await apiClient.get(`/lead-groups/${id}/details`);
    return response.data;
  },

  getAvailableContacts: async (id: number, search?: string): Promise<Contact[]> => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    
    const response = await apiClient.get(`/lead-groups/${id}/available-contacts?${params.toString()}`);
    return response.data;
  },

  create: async (data: CreateLeadGroupInput): Promise<LeadGroup> => {
    const response = await apiClient.post('/lead-groups', data);
    return response.data;
  },

  update: async (id: number, data: UpdateLeadGroupInput): Promise<LeadGroup> => {
    const response = await apiClient.put(`/lead-groups/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/lead-groups/${id}`);
  },

  duplicate: async (id: number, name: string): Promise<LeadGroup> => {
    const response = await apiClient.post(`/lead-groups/${id}/duplicate`, { name });
    return response.data;
  },

  assignContacts: async (groupId: number, contactIds: number[]): Promise<AssignmentResult> => {
    const response = await apiClient.post(`/lead-groups/${groupId}/contacts`, {
      contact_ids: contactIds,
    });
    return response.data;
  },

  removeContacts: async (groupId: number, contactIds: number[]): Promise<AssignmentResult> => {
    const response = await apiClient.delete(`/lead-groups/${groupId}/contacts`, {
      data: { contact_ids: contactIds },
    });
    return response.data;
  },

  bulkAssign: async (data: BulkAssignInput): Promise<BulkAssignResult> => {
    const response = await apiClient.post('/lead-groups/bulk/assign', data);
    return response.data;
  },
};

// React Query hooks
export const useLeadGroups = (filters: { search?: string } = {}) => {
  return useQuery({
    queryKey: leadGroupsKeys.list(filters),
    queryFn: () => leadGroupsApi.getAll(filters),
  });
};

export const useLeadGroupStats = () => {
  return useQuery({
    queryKey: leadGroupsKeys.stats(),
    queryFn: leadGroupsApi.getStats,
  });
};

export const useLeadGroup = (id: number) => {
  return useQuery({
    queryKey: leadGroupsKeys.detail(id),
    queryFn: () => leadGroupsApi.getById(id),
    enabled: !!id,
  });
};

export const useLeadGroupWithContacts = (id: number) => {
  return useQuery({
    queryKey: leadGroupsKeys.detailWithContacts(id),
    queryFn: () => leadGroupsApi.getByIdWithContacts(id),
    enabled: !!id,
  });
};

export const useAvailableContacts = (id: number, search?: string) => {
  return useQuery({
    queryKey: leadGroupsKeys.availableContacts(id, search),
    queryFn: () => leadGroupsApi.getAvailableContacts(id, search),
    enabled: !!id,
  });
};

export const useCreateLeadGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: leadGroupsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadGroupsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: leadGroupsKeys.stats() });
    },
  });
};

export const useUpdateLeadGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: UpdateLeadGroupInput & { id: number }) =>
      leadGroupsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: leadGroupsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: leadGroupsKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: leadGroupsKeys.detailWithContacts(variables.id) });
      queryClient.invalidateQueries({ queryKey: leadGroupsKeys.stats() });
    },
  });
};

export const useDeleteLeadGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: leadGroupsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadGroupsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: leadGroupsKeys.stats() });
    },
  });
};

export const useDuplicateLeadGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) =>
      leadGroupsApi.duplicate(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadGroupsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: leadGroupsKeys.stats() });
    },
  });
};

export const useAssignContacts = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ groupId, contactIds }: { groupId: number; contactIds: number[] }) =>
      leadGroupsApi.assignContacts(groupId, contactIds),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: leadGroupsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: leadGroupsKeys.detailWithContacts(variables.groupId) });
      queryClient.invalidateQueries({ queryKey: leadGroupsKeys.availableContacts(variables.groupId) });
      queryClient.invalidateQueries({ queryKey: leadGroupsKeys.stats() });
    },
  });
};

export const useRemoveContacts = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ groupId, contactIds }: { groupId: number; contactIds: number[] }) =>
      leadGroupsApi.removeContacts(groupId, contactIds),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: leadGroupsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: leadGroupsKeys.detailWithContacts(variables.groupId) });
      queryClient.invalidateQueries({ queryKey: leadGroupsKeys.availableContacts(variables.groupId) });
      queryClient.invalidateQueries({ queryKey: leadGroupsKeys.stats() });
    },
  });
};

export const useBulkAssignContacts = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: leadGroupsApi.bulkAssign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadGroupsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: leadGroupsKeys.stats() });
      // Invalidate all detail queries since we don't know which groups were affected
      queryClient.invalidateQueries({ queryKey: leadGroupsKeys.details() });
    },
  });
};