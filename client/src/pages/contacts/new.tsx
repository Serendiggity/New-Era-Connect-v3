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
          await createContact.mutateAsync(data as any);
        }}
      />
    </div>
  );
}