import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ContactForm, useContact, useUpdateContact } from '../../features/contacts';
import { LoadingSpinner } from '../../shared/ui';

export default function EditContactPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const contactId = parseInt(id!, 10);
  const { data: contact, isLoading, error } = useContact(contactId);
  const updateContact = useUpdateContact();
  const [updateError, setUpdateError] = React.useState<string | null>(null);
  const [isUpdating, setIsUpdating] = React.useState(false);

  // Handle invalid contact ID
  if (id && isNaN(contactId)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Invalid Contact</h1>
          <p className="text-gray-600 mb-6">The contact ID provided is not valid.</p>
          <button
            onClick={() => navigate('/contacts')}
            className="text-blue-600 hover:text-blue-800"
          >
            ← Back to Contacts
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) return <LoadingSpinner />;
  if (error || !contact) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Contact Not Found</h1>
          <p className="text-gray-600 mb-6">The contact you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/contacts')}
            className="text-blue-600 hover:text-blue-800"
          >
            ← Back to Contacts
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(`/contacts/${contactId}`)}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          ← Back to Contact
        </button>
        <h1 className="text-3xl font-bold">Edit Contact</h1>
      </div>
      <ContactForm
        contact={contact}
        skipNavigation={true}
        onSubmit={async (data) => {
          setIsUpdating(true);
          setUpdateError(null);
          try {
            await updateContact.mutateAsync({ id: contactId, ...data });
            navigate(`/contacts/${contactId}`, { replace: true });
          } catch (err: any) {
            setUpdateError(err?.message || 'Failed to update contact. Please try again.');
          } finally {
            setIsUpdating(false);
          }
        }}
        onCancel={() => navigate(`/contacts/${contactId}`)}
      />
      {isUpdating && <div className="text-blue-600 mt-2">Updating contact...</div>}
      {updateError && <div className="text-red-600 mt-2">{updateError}</div>}
    </div>
  );
}