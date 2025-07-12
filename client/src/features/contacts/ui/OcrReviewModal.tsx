import React, { useState, useEffect } from 'react';
import { X, Save, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { Button } from '../../../shared/ui/Button';
import { Card } from '../../../shared/ui/Card';
import type { Contact } from '@business-card-manager/shared';

interface OcrReviewModalProps {
  contact: Contact & { businessCardUrl?: string };
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedContact: Partial<Contact>) => Promise<void>;
  isSaving?: boolean;
}

export function OcrReviewModal({
  contact,
  isOpen,
  onClose,
  onSave,
  isSaving = false,
}: OcrReviewModalProps) {
  const [formData, setFormData] = useState({
    full_name: contact.full_name || '',
    email: contact.email || '',
    company: contact.company || '',
    title: contact.title || '',
    phone: contact.phone || '',
    linkedin_url: contact.linkedin_url || '',
  });
  
  const [showRawData, setShowRawData] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Reset form data when contact changes
  useEffect(() => {
    setFormData({
      full_name: contact.full_name || '',
      email: contact.email || '',
      company: contact.company || '',
      title: contact.title || '',
      phone: contact.phone || '',
      linkedin_url: contact.linkedin_url || '',
    });
  }, [contact]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const updatedData = {
      ...formData,
      status: 'user_verified' as const,
    };

    await onSave(updatedData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const formatConfidence = (confidence?: number) => {
    if (confidence === undefined) return 'Unknown';
    return `${Math.round(confidence * 100)}%`;
  };

  const getConfidenceColor = (confidence?: number) => {
    if (confidence === undefined) return 'text-gray-500';
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold">Review OCR Results</h2>
            <p className="text-sm text-gray-600 mt-1">
              Confidence: <span className={getConfidenceColor(contact.ocr_confidence)}>
                {formatConfidence(contact.ocr_confidence)}
              </span>
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex h-[calc(90vh-120px)]">
          {/* Business Card Image */}
          <div className="w-1/2 p-6 border-r">
            <div className="h-full flex flex-col">
              <h3 className="text-lg font-medium mb-4">Business Card</h3>
              
              {contact.business_card_url && !imageError ? (
                <div className="flex-1 bg-gray-50 rounded-lg p-4 flex items-center justify-center">
                  <img
                    src={contact.business_card_url}
                    alt="Business card"
                    className="max-w-full max-h-full object-contain"
                    onError={() => setImageError(true)}
                  />
                </div>
              ) : (
                <div className="flex-1 bg-gray-50 rounded-lg p-4 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                    <p>Business card image not available</p>
                  </div>
                </div>
              )}

              {/* Raw OCR Data Toggle */}
              {contact.ocr_raw_data && (
                <div className="mt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowRawData(!showRawData)}
                    className="flex items-center gap-2"
                  >
                    {showRawData ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    {showRawData ? 'Hide' : 'Show'} Raw OCR Data
                  </Button>
                  
                  {showRawData && (
                    <Card className="mt-2 p-3">
                      <pre className="text-xs overflow-auto max-h-32 whitespace-pre-wrap">
                        {JSON.stringify(contact.ocr_raw_data, null, 2)}
                      </pre>
                    </Card>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Contact Form */}
          <div className="w-1/2 p-6">
            <form onSubmit={handleSubmit} className="h-full flex flex-col">
              <h3 className="text-lg font-medium mb-4">Contact Information</h3>
              
              <div className="flex-1 space-y-4 overflow-y-auto">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Company */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Company
                  </label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Job Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* LinkedIn URL */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    LinkedIn URL
                  </label>
                  <input
                    type="url"
                    value={formData.linkedin_url}
                    onChange={(e) => handleInputChange('linkedin_url', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex justify-end gap-3 pt-6 border-t mt-6">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onClose}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving || !formData.full_name.trim()}
                >
                  {isSaving ? (
                    <>Saving...</>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save & Verify
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}