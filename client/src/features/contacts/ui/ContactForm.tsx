import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload } from 'lucide-react';
import { Button, Card } from '../../../shared/ui';
import { BusinessCardUpload } from './BusinessCardUpload';
import { useUploadBusinessCardForContact } from '../api/contacts.api';
import type { Contact, CreateContactInput, UpdateContactInput, ContactStatus } from '../../../../../shared/src/types/contact';

interface ContactFormProps {
  contact?: Contact;
  eventId?: number;
  onSubmit: (data: CreateContactInput | UpdateContactInput) => Promise<void>;
  onCancel?: () => void;
  skipNavigation?: boolean; // Allow parent to handle navigation
}

export function ContactForm({ contact, eventId, onSubmit, onCancel, skipNavigation }: ContactFormProps) {
  const navigate = useNavigate();
  const uploadBusinessCardForContact = useUploadBusinessCardForContact();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadError, setUploadError] = useState<string>('');
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
      
      // Only navigate if not explicitly skipped by parent
      if (!skipNavigation) {
        navigate(contact ? `/contacts/${contact.id}` : '/contacts');
      }
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

  const handleUploadBusinessCard = async (file: File) => {
    if (!contact?.id) return;
    
    try {
      setUploadError('');
      await uploadBusinessCardForContact.mutateAsync({ contactId: contact.id, file });
      setShowUpload(false);
      // The contact will be refetched automatically via React Query
    } catch (error: any) {
      setUploadError(error.response?.data?.error || 'Failed to upload business card');
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Upload Business Card Section for existing contacts */}
      {contact && !contact.business_card_url && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-blue-900">No Business Card</h3>
              <p className="text-sm text-blue-700">Upload a business card to extract contact information</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowUpload(true)}
              className="text-blue-600 hover:text-blue-700"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Card
            </Button>
          </div>
        </Card>
      )}

      {/* Upload Modal */}
      {showUpload && contact && (
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Upload Business Card</h3>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowUpload(false)}
            >
              ✕
            </Button>
          </div>
          <BusinessCardUpload
            onUpload={handleUploadBusinessCard}
            isUploading={uploadBusinessCardForContact.isPending}
            error={uploadError}
          />
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="full_name" className="block text-sm font-medium mb-1">
          Full Name * 
          {contact?.user_modified_fields?.full_name && (
            <span className="ml-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
              ✓ Manually verified
            </span>
          )}
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
    </div>
  );
}