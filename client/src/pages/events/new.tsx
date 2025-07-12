import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { CreateEventInput } from '@business-card-manager/shared';
import { EventForm } from '../../features/events/ui/EventForm';
import { useCreateEvent } from '../../features/events/api/events.api';

export function CreateEventPage() {
  const navigate = useNavigate();
  const createEventMutation = useCreateEvent();

  const handleSubmit = async (data: CreateEventInput) => {
    try {
      const newEvent = await createEventMutation.mutateAsync(data);
      navigate(`/events/${newEvent.id}`);
      // Success feedback could be added here (toast notification)
    } catch (error) {
      console.error('Failed to create event:', error);
      // Error feedback could be added here (toast notification)
    }
  };

  const handleCancel = () => {
    navigate('/events');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <button
            onClick={handleCancel}
            className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
          >
            ← Back to Events
          </button>
        </div>
        
        <EventForm
          isLoading={createEventMutation.isPending}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}