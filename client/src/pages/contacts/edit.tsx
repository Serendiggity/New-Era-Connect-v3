import React from 'react';
import { useParams } from 'react-router-dom';
import { ContactForm, useContact, useUpdateContact } from '../../features/contacts';
import { LoadingSpinner } from '../../shared/ui';

export default function EditContactPage() {
  const { id } = useParams<{ id: string }>();
  const contactId = parseInt(id!, 10);
  const { data: contact, isLoading } = useContact(contactId);
  const updateContact = useUpdateContact();

  if (isLoading) return <LoadingSpinner />;
  if (!contact) return <div className="text-red-500">Contact not found</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">Edit Contact</h1>
      <ContactForm
        contact={contact}
        onSubmit={async (data) => {
          await updateContact.mutateAsync({ ...data, id: contactId });
        }}
      />
    </div>
  );
}