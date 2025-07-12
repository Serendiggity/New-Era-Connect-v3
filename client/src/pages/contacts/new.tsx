import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { ContactForm, useCreateContact } from '../../features/contacts';

export default function NewContactPage() {
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('eventId') ? parseInt(searchParams.get('eventId')!, 10) : undefined;
  const createContact = useCreateContact();

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">Add New Contact</h1>
      <ContactForm
        eventId={eventId}
        onSubmit={async (data) => {
          // Only pass CreateContactInput to createContact.mutateAsync
          const { full_name, email, company, title, phone, linkedin_url, business_card_url, event_id } = data as any;
          await createContact.mutateAsync({ full_name, email, company, title, phone, linkedin_url, business_card_url, event_id });
        }}
      />
    </div>
  );
}