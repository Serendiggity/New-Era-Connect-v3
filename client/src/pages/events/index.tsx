import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Event } from '@business-card-manager/shared';
import { EventList } from '../../features/events/ui/EventList';
import { useEvents, useDeleteEvent } from '../../features/events/api/events.api';

export function EventsPage() {
  const navigate = useNavigate();
  const { data: events, isLoading, error } = useEvents();
  const deleteEventMutation = useDeleteEvent();

  const handleCreateEvent = () => {
    navigate('/events/new');
  };

  const handleEditEvent = (event: Event) => {
    navigate(`/events/${event.id}/edit`);
  };

  const handleDeleteEvent = async (event: Event) => {
    try {
      await deleteEventMutation.mutateAsync(event.id);
      // Success feedback could be added here (toast notification)
    } catch (error) {
      console.error('Failed to delete event:', error);
      // Error feedback could be added here (toast notification)
    }
  };

  const handleViewEvent = (event: Event) => {
    navigate(`/events/${event.id}`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <EventList
        events={events}
        isLoading={isLoading}
        error={error}
        onCreateEvent={handleCreateEvent}
        onEditEvent={handleEditEvent}
        onDeleteEvent={handleDeleteEvent}
        onViewEvent={handleViewEvent}
      />
    </div>
  );
}