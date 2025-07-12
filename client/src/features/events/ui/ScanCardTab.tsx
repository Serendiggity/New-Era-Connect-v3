import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BusinessCardUpload, useUploadBusinessCard } from '../../contacts';
import { ContactList, useContacts } from '../../contacts';
import { Button } from '../../../shared/ui';
import { Eye, Plus } from 'lucide-react';

interface ScanCardTabProps {
  eventId: number;
}

export function ScanCardTab({ eventId }: ScanCardTabProps) {
  const navigate = useNavigate();
  const uploadBusinessCard = useUploadBusinessCard();
  const { data: contacts } = useContacts({ eventId });
  
  const [uploadError, setUploadError] = useState<string>('');
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleUpload = async (file: File, contactData?: { event_id?: number; full_name?: string }) => {
    try {
      setUploadError('');
      const result = await uploadBusinessCard.mutateAsync({ 
        file, 
        contactData: { ...contactData, event_id: eventId } 
      });
      setUploadSuccess(true);
      
      // Clear success message after 3 seconds
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (error: any) {
      setUploadError(error.response?.data?.error || 'Failed to upload business card');
      setUploadSuccess(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <BusinessCardUpload
        onUpload={handleUpload}
        eventId={eventId}
        isUploading={uploadBusinessCard.isPending}
        error={uploadError}
        success={uploadSuccess}
      />

      {/* Contacts from this event */}
      {contacts && contacts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              Contacts from this Event ({contacts.length})
            </h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => navigate(`/contacts?eventId=${eventId}`)}
                className="flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                View All
              </Button>
              <Button
                onClick={() => navigate(`/contacts/new?eventId=${eventId}`)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Manual
              </Button>
            </div>
          </div>
          
          {/* Show recent contacts from this event */}
          <div className="bg-gray-50 rounded-lg p-4">
            <ContactList eventId={eventId} />
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">How to scan business cards</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Take clear photos of business cards with good lighting</li>
          <li>• Ensure the card is flat and all text is readable</li>
          <li>• The system will automatically extract contact information</li>
          <li>• Low-confidence results will be flagged for manual review</li>
          <li>• You can add multiple cards at once</li>
        </ul>
      </div>
    </div>
  );
}