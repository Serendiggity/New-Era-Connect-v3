import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Event, CreateEventInput, UpdateEventInput } from '@business-card-manager/shared';
import { apiClient, ApiError } from '../../../shared/api/client';

// Query keys
export const eventsKeys = {
  all: ['events'] as const,
  lists: () => [...eventsKeys.all, 'list'] as const,
  list: (filters: string) => [...eventsKeys.lists(), filters] as const,
  details: () => [...eventsKeys.all, 'detail'] as const,
  detail: (id: number) => [...eventsKeys.details(), id] as const,
};

// API functions
const eventsApi = {
  getAll: async (): Promise<Event[]> => {
    const response = await apiClient.get<Event[]>('/api/events');
    return response.data;
  },

  getById: async (id: number): Promise<Event> => {
    const response = await apiClient.get<Event>(`/api/events/${id}`);
    return response.data;
  },

  create: async (data: CreateEventInput): Promise<Event> => {
    const response = await apiClient.post<Event>('/api/events', data);
    return response.data;
  },

  update: async ({ id, data }: { id: number; data: UpdateEventInput }): Promise<Event> => {
    const response = await apiClient.put<Event>(`/api/events/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/events/${id}`);
  },
};

// React Query hooks

export function useEvents() {
  return useQuery({
    queryKey: eventsKeys.lists(),
    queryFn: eventsApi.getAll,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useEvent(id: number) {
  return useQuery({
    queryKey: eventsKeys.detail(id),
    queryFn: () => eventsApi.getById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: eventsApi.create,
    onSuccess: (newEvent) => {
      // Update the events list cache
      queryClient.setQueryData<Event[]>(eventsKeys.lists(), (old) => {
        return old ? [newEvent, ...old] : [newEvent];
      });
      
      // Set the new event in detail cache
      queryClient.setQueryData(eventsKeys.detail(newEvent.id), newEvent);
      
      // Optionally invalidate to ensure fresh data
      queryClient.invalidateQueries({ queryKey: eventsKeys.lists() });
    },
    onError: (error: ApiError) => {
      console.error('Failed to create event:', error);
    },
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: eventsApi.update,
    onSuccess: (updatedEvent) => {
      // Update the detail cache
      queryClient.setQueryData(eventsKeys.detail(updatedEvent.id), updatedEvent);
      
      // Update the events list cache
      queryClient.setQueryData<Event[]>(eventsKeys.lists(), (old) => {
        return old?.map((event) =>
          event.id === updatedEvent.id ? updatedEvent : event
        );
      });
    },
    onError: (error: ApiError) => {
      console.error('Failed to update event:', error);
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: eventsApi.delete,
    onSuccess: (_, deletedId) => {
      // Remove from events list cache
      queryClient.setQueryData<Event[]>(eventsKeys.lists(), (old) => {
        return old?.filter((event) => event.id !== deletedId);
      });
      
      // Remove from detail cache
      queryClient.removeQueries({ queryKey: eventsKeys.detail(deletedId) });
    },
    onError: (error: ApiError) => {
      console.error('Failed to delete event:', error);
    },
  });
}