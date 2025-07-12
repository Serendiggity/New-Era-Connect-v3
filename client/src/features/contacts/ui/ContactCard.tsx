import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../../shared/ui';
import { getContactStatusDisplay, formatPhoneNumber, getContactInitials } from '../lib/contacts.utils';
import type { Contact } from '../../../../../shared/src/types/contact';

interface ContactCardProps {
  contact: Contact;
  onEdit?: () => void;
  onDelete?: () => void;
}

const statusClassMap: Record<string, string> = {
  processing: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  pending_review: 'bg-yellow-100 text-yellow-800',
  user_verified: 'bg-green-100 text-green-800',
  default: 'bg-gray-100 text-gray-800',
};

export function ContactCard({ contact, onEdit, onDelete }: ContactCardProps) {
  const statusDisplay = getContactStatusDisplay(contact.status);
  const initials = getContactInitials(contact.full_name);
  const ocrConfidence = contact.ocr_confidence ? parseFloat(contact.ocr_confidence) : undefined;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
          {contact.business_card_url ? (
            <img
              src={contact.business_card_url}
              alt={contact.full_name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <span className="text-lg font-semibold text-gray-600">{initials}</span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <Link
                to={`/contacts/${contact.id}`}
                className="text-lg font-medium text-gray-900 hover:text-blue-600"
              >
                {contact.full_name}
              </Link>
              {contact.title && (
                <p className="text-sm text-gray-600">{contact.title}</p>
              )}
              {contact.company && (
                <p className="text-sm text-gray-600">{contact.company}</p>
              )}
            </div>

            {/* Status badge */}
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-sm flex-shrink-0 ${statusClassMap[contact.status] || statusClassMap.default}`}>
              <span>{statusDisplay.emoji}</span>
              <span>{statusDisplay.label}</span>
            </span>
          </div>

          {/* Contact info */}
          <div className="mt-2 space-y-1">
            {contact.email && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">Email:</span>
                <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline truncate">
                  {contact.email}
                </a>
              </div>
            )}
            {contact.phone && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">Phone:</span>
                <a href={`tel:${contact.phone}`} className="text-blue-600 hover:underline">
                  {formatPhoneNumber(contact.phone)}
                </a>
              </div>
            )}
            {contact.linkedin_url && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">LinkedIn:</span>
                <a
                  href={contact.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  View Profile
                </a>
              </div>
            )}
          </div>

          {/* OCR confidence if available */}
          {ocrConfidence !== undefined && (
            <div className="mt-2 text-sm">
              <span className="text-gray-500">OCR Confidence:</span>{' '}
              <span className={ocrConfidence < 0.7 ? 'text-red-600' : 'text-green-600'}>
                {(ocrConfidence * 100).toFixed(0)}%
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="mt-3 flex gap-3 text-sm">
            <button
              onClick={onEdit}
              className="text-blue-600 hover:underline"
            >
              Edit
            </button>
            <button
              onClick={onDelete}
              className="text-red-600 hover:underline"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}