import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ContactDetail, useContact, useDeleteContact } from '../../features/contacts';

export default function ContactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const contactId = id ? parseInt(id, 10) : 0;
  
  const { data: contact, isLoading, error } = useContact(contactId);
  const deleteContact = useDeleteContact();

  const handleEdit = () => {
    navigate(`/contacts/${contactId}/edit`);
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this contact?')) {
      await deleteContact.mutateAsync(contactId);
      navigate('/contacts');
    }
  };

  const handleBack = () => {
    navigate('/contacts');
  };

  // Handle invalid contact ID
  if (id && isNaN(contactId)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Invalid Contact</h1>
          <p className="text-gray-600 mb-6">The contact ID provided is not valid.</p>
          <button
            onClick={handleBack}
            className="text-blue-600 hover:text-blue-800"
          >
            ← Back to Contacts
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <ContactDetail
        contact={contact}
        isLoading={isLoading}
        error={error}
        onEdit={contact ? handleEdit : undefined}
        onDelete={contact ? handleDelete : undefined}
        onBack={handleBack}
      />
    </div>
  );
}