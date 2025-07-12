import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ContactForm, useCreateContact, BusinessCardUpload, useUploadBusinessCard } from '../../features/contacts';
import { Button } from '../../shared/ui';

export default function NewContactPage() {
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('eventId') ? parseInt(searchParams.get('eventId')!, 10) : undefined;
  const navigate = useNavigate();
  const createContact = useCreateContact();
  const uploadBusinessCard = useUploadBusinessCard();
  
  const [method, setMethod] = useState<'upload' | 'manual'>('upload');
  const [uploadError, setUploadError] = useState<string>('');
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleUpload = async (file: File, contactData?: { event_id?: number; full_name?: string }) => {
    try {
      setUploadError('');
      const result = await uploadBusinessCard.mutateAsync({ file, contactData });
      setUploadSuccess(true);
      
      // Navigate to the new contact after a brief success message
      setTimeout(() => {
        navigate(`/contacts/${result.contact.id}`);
      }, 2000);
    } catch (error: any) {
      setUploadError(error.response?.data?.error || 'Failed to upload business card');
      setUploadSuccess(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">Add New Contact</h1>
      
      {/* Method Selection */}
      <div className="mb-6">
        <div className="flex gap-2 border-b">
          <Button
            variant={method === 'upload' ? 'default' : 'ghost'}
            onClick={() => setMethod('upload')}
            className="rounded-b-none"
          >
            📷 Scan Business Card
          </Button>
          <Button
            variant={method === 'manual' ? 'default' : 'ghost'}
            onClick={() => setMethod('manual')}
            className="rounded-b-none"
          >
            ✏️ Manual Entry
          </Button>
        </div>
      </div>

      {method === 'upload' ? (
        <BusinessCardUpload
          onUpload={handleUpload}
          eventId={eventId}
          isUploading={uploadBusinessCard.isPending}
          error={uploadError}
          success={uploadSuccess}
        />
      ) : (
        <ContactForm
          eventId={eventId}
          onSubmit={async (data) => {
            const { full_name, email, company, title, phone, linkedin_url, business_card_url, event_id } = data as any;
            await createContact.mutateAsync({ full_name, email, company, title, phone, linkedin_url, business_card_url, event_id });
          }}
        />
      )}
    </div>
  );
}