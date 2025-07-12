import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../shared/ui';
import type { Contact, CreateContactInput, UpdateContactInput, ContactStatus } from '../../../../../shared/src/types/contact';

interface ContactFormProps {
  contact?: Contact;
  eventId?: number;
  onSubmit: (data: CreateContactInput | UpdateContactInput) => Promise<void>;
  onCancel?: () => void;
}

export function ContactForm({ contact, eventId, onSubmit, onCancel }: ContactFormProps) {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    full_name: contact?.full_name || '',
    email: contact?.email || '',
    company: contact?.company || '',
    title: contact?.title || '',
    phone: contact?.phone || '',
    linkedin_url: contact?.linkedin_url || '',
    status: contact?.status || 'processing' as ContactStatus,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let submitData = contact
        ? { ...formData } // Update - all fields are optional
        : eventId !== undefined
          ? { ...formData, event_id: eventId }
          : { ...formData }; // Create - event_id is optional

      // Remove empty optional fields (like linkedin_url) from submitData
      const cleanedData = { ...submitData } as Record<string, unknown>;
      Object.keys(cleanedData).forEach((key) => {
        if (cleanedData[key] === "") {
          delete cleanedData[key];
        }
      });

      await onSubmit(cleanedData);
      navigate(contact ? `/contacts/${contact.id}` : '/contacts');
    } catch (error) {
      console.error('Error submitting contact:', error);
      alert('Failed to save contact. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      window.history.back();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
      <div>
        <label htmlFor="full_name" className="block text-sm font-medium mb-1">
          Full Name *
        </label>
        <input
          id="full_name"
          type="text"
          required
          value={formData.full_name}
          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="company" className="block text-sm font-medium mb-1">
            Company
          </label>
          <input
            id="company"
            type="text"
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-1">
            Title
          </label>
          <input
            id="title"
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium mb-1">
          Phone
        </label>
        <input
          id="phone"
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="linkedin_url" className="block text-sm font-medium mb-1">
          LinkedIn URL
        </label>
        <input
          id="linkedin_url"
          type="url"
          value={formData.linkedin_url}
          onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
          placeholder="https://linkedin.com/in/..."
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {contact && (
        <div>
          <label htmlFor="status" className="block text-sm font-medium mb-1">
            Status
          </label>
          <select
            id="status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as ContactStatus })}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="pending_review">Needs Review</option>
            <option value="user_verified">Verified</option>
          </select>
        </div>
      )}

      {/* Display OCR info if available */}
      {contact?.ocr_confidence && (
        <div className="bg-gray-50 p-4 rounded-md">
          <h4 className="text-sm font-medium mb-2">OCR Information</h4>
          <div className="text-sm text-gray-600">
            <p>Confidence: {(parseFloat(contact.ocr_confidence) * 100).toFixed(0)}%</p>
            {contact.business_card_url && (
              <p className="mt-1">
                <a
                  href={contact.business_card_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  View Business Card
                </a>
              </p>
            )}
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : contact ? 'Update Contact' : 'Create Contact'}
        </Button>
        <Button type="button" variant="secondary" onClick={handleCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}