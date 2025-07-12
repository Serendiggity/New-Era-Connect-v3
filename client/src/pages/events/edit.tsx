import * as React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UpdateEventInput } from '@business-card-manager/shared';
import { EventForm } from '../../features/events/ui/EventForm';
import { useEvent, useUpdateEvent } from '../../features/events/api/events.api';
import { LoadingSpinner } from '../../shared/ui/LoadingSpinner';
import { Card, CardContent } from '../../shared/ui/Card';

export function EditEventPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const eventId = id ? parseInt(id, 10) : 0;
  
  const { data: event, isLoading: isLoadingEvent, error } = useEvent(eventId);
  const updateEventMutation = useUpdateEvent();

  const handleSubmit = async (data: UpdateEventInput) => {
    try {
      await updateEventMutation.mutateAsync({ id: eventId, data });
      navigate(`/events/${eventId}`);
      // Success feedback could be added here (toast notification)
    } catch (error) {
      console.error('Failed to update event:', error);
      // Error feedback could be added here (toast notification)
    }
  };

  const handleCancel = () => {
    navigate(`/events/${eventId}`);
  };

  // Handle invalid event ID
  if (id && isNaN(eventId)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Invalid Event</h1>
          <p className="text-gray-600 mb-6">The event ID provided is not valid.</p>
          <button
            onClick={() => navigate('/events')}
            className="text-blue-600 hover:text-blue-800"
          >
            ← Back to Events
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoadingEvent) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error || !event) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Event Not Found</h1>
          <p className="text-gray-600 mb-6">
            {error ? error.message : 'The event you are looking for could not be found.'}
          </p>
          <button
            onClick={() => navigate('/events')}
            className="text-blue-600 hover:text-blue-800"
          >
            ← Back to Events
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <button
            onClick={handleCancel}
            className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
          >
            ← Back to Event
          </button>
        </div>
        
        <EventForm
          event={event}
          isLoading={updateEventMutation.isPending}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}