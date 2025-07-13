import React from 'react';
import { Link } from 'react-router-dom';
import { useUpdateContact } from '../api/contacts.api';
import { Button, Card, LoadingSpinner } from '../../../shared/ui';
import { getContactStatusDisplay, formatPhoneNumber, getContactInitials } from '../lib/contacts.utils';

const statusClassMap: Record<string, string> = {
  processing: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  pending_review: 'bg-yellow-100 text-yellow-800',
  user_verified: 'bg-green-100 text-green-800',
  default: 'bg-gray-100 text-gray-800',
};

const getStatusClasses = (status: string): string => {
  return statusClassMap[status] || statusClassMap.default;
};
interface ContactDetailProps {
  contact?: any;
  isLoading?: boolean;
  error?: any;
  onEdit?: () => void;
  onDelete?: () => void;
  onBack?: () => void;
}

export function ContactDetail({ contact, isLoading, error, onEdit, onDelete, onBack }: ContactDetailProps) {
  const updateContact = useUpdateContact();

  const handleVerify = async () => {
    if (!contact) return;
    try {
      await updateContact.mutateAsync({
        id: contact.id,
        status: 'user_verified',
      });
    } catch (error) {
      alert('Failed to verify contact. Please try again.');
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (error || !contact) return <div className="text-red-500">Error loading contact</div>;

  const statusDisplay = getContactStatusDisplay(contact.status);
  const initials = getContactInitials(contact.full_name);
  const ocrConfidence = contact.ocr_confidence ? parseFloat(contact.ocr_confidence) : undefined;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              ← Back to Contacts
            </button>
          )}
          <h1 className="text-3xl font-bold">Contact Details</h1>
        </div>
        <div className="flex gap-2">
          {onEdit && (
            <Button variant="secondary" onClick={onEdit}>
              Edit
            </Button>
          )}
          {onDelete && (
            <Button variant="danger" onClick={onDelete}>
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Main info card */}
      <Card>
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
            {contact.business_card_url ? (
              <img
                src={contact.business_card_url}
                alt={contact.full_name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-3xl font-semibold text-gray-600">{initials}</span>
            )}
          </div>

          {/* Contact info */}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-semibold">{contact.full_name}</h2>
                {contact.title && <p className="text-gray-600">{contact.title}</p>}
                {contact.company && <p className="text-gray-600">{contact.company}</p>}
              </div>
              
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded text-sm ${getStatusClasses(contact.status)}`}>
                <span>{statusDisplay.emoji}</span>
                <span>{statusDisplay.label}</span>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Email</h3>
                {contact.email ? (
                  <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline">
                    {contact.email}
                  </a>
                ) : (
                  <span className="text-gray-400">Not provided</span>
                )}
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Phone</h3>
                {contact.phone ? (
                  <a href={`tel:${contact.phone}`} className="text-blue-600 hover:underline">
                    {formatPhoneNumber(contact.phone)}
                  </a>
                ) : (
                  <span className="text-gray-400">Not provided</span>
                )}
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">LinkedIn</h3>
                {contact.linkedin_url ? (
                  <a
                    href={contact.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    View Profile
                  </a>
                ) : (
                  <span className="text-gray-400">Not provided</span>
                )}
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Event</h3>
                {contact.event_id ? (
                  <Link to={`/events/${contact.event_id}`} className="text-blue-600 hover:underline">
                    View Event
                  </Link>
                ) : (
                  <span className="text-gray-400">No event associated</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* OCR Information */}
      {ocrConfidence !== undefined && (
        <Card>
          <h3 className="text-lg font-semibold mb-4">OCR Information</h3>
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-500">Confidence Score:</span>{' '}
              <span className={ocrConfidence < 0.7 ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>
                {(ocrConfidence * 100).toFixed(0)}%
              </span>
              {ocrConfidence < 0.7 && (
                <span className="ml-2 text-sm text-red-600">(Low confidence - review recommended)</span>
              )}
            </div>

            {contact.business_card_url && (
              <div>
                <span className="text-sm font-medium text-gray-500">Business Card:</span>{' '}
                <a
                  href={contact.business_card_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  View Image
                </a>
              </div>
            )}

            {contact.status === 'pending_review' && (
              <div className="pt-2">
                <Button onClick={handleVerify} size="sm">
                  Mark as Verified
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Timestamps */}
      <Card>
        <h3 className="text-lg font-semibold mb-4">Activity</h3>
        <div className="space-y-2 text-sm">
          <div>
            <span className="text-gray-500">Created:</span>{' '}
            {new Date(contact.created_at).toLocaleString()}
          </div>
          {contact.processed_at && (
            <div>
              <span className="text-gray-500">Processed:</span>{' '}
              {new Date(contact.processed_at).toLocaleString()}
            </div>
          )}
          {contact.reviewed_at && (
            <div>
              <span className="text-gray-500">Reviewed:</span>{' '}
              {new Date(contact.reviewed_at).toLocaleString()}
            </div>
          )}
          <div>
            <span className="text-gray-500">Last Updated:</span>{' '}
            {new Date(contact.updated_at).toLocaleString()}
          </div>
        </div>
      </Card>
    </div>
  );
}