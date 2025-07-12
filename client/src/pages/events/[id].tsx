import * as React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { EventDetail } from '../../features/events/ui/EventDetail';
import { useEvent, useDeleteEvent } from '../../features/events/api/events.api';

export function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const eventId = id ? parseInt(id, 10) : 0;
  
  const { data: event, isLoading, error } = useEvent(eventId);
  const deleteEventMutation = useDeleteEvent();

  const handleEdit = () => {
    navigate(`/events/${eventId}/edit`);
  };

  const handleDelete = async () => {
    try {
      await deleteEventMutation.mutateAsync(eventId);
      navigate('/events');
      // Success feedback could be added here (toast notification)
    } catch (error) {
      console.error('Failed to delete event:', error);
      // Error feedback could be added here (toast notification)
    }
  };

  const handleBack = () => {
    navigate('/events');
  };

  const handleScanCard = () => {
    // Navigate to scan card page (to be implemented)
    navigate(`/events/${eventId}/scan`);
  };

  const handleViewContacts = () => {
    // Navigate to contacts page (to be implemented)
    navigate(`/events/${eventId}/contacts`);
  };

  const handleCreateCampaign = () => {
    // Navigate to create campaign page (to be implemented)
    navigate(`/events/${eventId}/campaigns/new`);
  };

  // Handle invalid event ID
  if (id && isNaN(eventId)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Invalid Event</h1>
          <p className="text-gray-600 mb-6">The event ID provided is not valid.</p>
          <button
            onClick={handleBack}
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
      <EventDetail
        event={event}
        isLoading={isLoading}
        error={error}
        onEdit={event ? handleEdit : undefined}
        onDelete={event ? handleDelete : undefined}
        onBack={handleBack}
        onScanCard={event ? handleScanCard : undefined}
        onViewContacts={event ? handleViewContacts : undefined}
        onCreateCampaign={event ? handleCreateCampaign : undefined}
      />
    </div>
  );
}