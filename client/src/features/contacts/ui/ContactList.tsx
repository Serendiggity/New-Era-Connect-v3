import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useContacts, useDeleteContact, useBulkUpdateContactStatus, ContactFilters } from '../api/contacts.api';
import { getContactStatusDisplay, formatPhoneNumber } from '../lib/contacts.utils';
import { Button, LoadingSpinner } from '../../../shared/ui';
import type { ContactStatus } from '../../../../../shared/src/types/contact';

interface ContactListProps {
  eventId?: number;
  onContactSelect?: (contactId: number) => void;
}

export function ContactList({ eventId, onContactSelect }: ContactListProps) {
  const [filters, setFilters] = useState<ContactFilters>({ eventId });
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  
  const { data: contacts, isLoading, error } = useContacts(filters);
  const deleteContact = useDeleteContact();
  const bulkUpdateStatus = useBulkUpdateContactStatus();

  const handleSelectAll = () => {
    if (selectedIds.size === contacts?.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(contacts?.map(c => c.id) || []));
    }
  };

  const handleSelectContact = (id: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkStatusUpdate = async (status: ContactStatus) => {
    if (selectedIds.size === 0) return;
    
    await bulkUpdateStatus.mutateAsync({
      contactIds: Array.from(selectedIds),
      status,
    });
    setSelectedIds(new Set());
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this contact?')) {
      await deleteContact.mutateAsync(id);
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div className="text-red-500">Error loading contacts</div>;
  if (!contacts?.length) return <div className="text-gray-500">No contacts found</div>;

  const statusClassMap: Record<string, string> = {
    processing: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    pending_review: 'bg-yellow-100 text-yellow-800',
    user_verified: 'bg-green-100 text-green-800',
    default: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4 items-center">
        <input
          type="text"
          placeholder="Search contacts..."
          className="px-3 py-2 border rounded-md"
          value={filters.search || ''}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
        
        <select
          className="px-3 py-2 border rounded-md"
          value={filters.status || ''}
          onChange={(e) => setFilters({ ...filters, status: e.target.value as ContactStatus || undefined })}
        >
          <option value="">All statuses</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="pending_review">Needs Review</option>
          <option value="user_verified">Verified</option>
        </select>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={filters.needsReview || false}
            onChange={(e) => setFilters({ ...filters, needsReview: e.target.checked })}
          />
          Needs Review Only
        </label>
      </div>

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <div className="flex gap-2 p-2 bg-gray-100 rounded">
          <span className="text-sm font-medium">{selectedIds.size} selected</span>
          <Button size="sm" onClick={() => handleBulkStatusUpdate('user_verified')}>
            Mark as Verified
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setSelectedIds(new Set())}>
            Clear Selection
          </Button>
        </div>
      )}

      {/* Contact table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-3 py-2">
                <input
                  type="checkbox"
                  checked={selectedIds.size === contacts.length}
                  onChange={handleSelectAll}
                />
              </th>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">Company</th>
              <th className="px-3 py-2 text-left">Email</th>
              <th className="px-3 py-2 text-left">Phone</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Confidence</th>
              <th className="px-3 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {contacts.map((contact) => {
              const statusDisplay = getContactStatusDisplay(contact.status);
              const ocrConfidence = contact.ocr_confidence ? parseFloat(contact.ocr_confidence) : undefined;
              
              return (
                <tr key={contact.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(contact.id)}
                      onChange={() => handleSelectContact(contact.id)}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Link
                      to={`/contacts/${contact.id}`}
                      className="font-medium text-blue-600 hover:underline"
                      onClick={() => onContactSelect?.(contact.id)}
                    >
                      {contact.full_name}
                    </Link>
                    {contact.title && (
                      <div className="text-sm text-gray-500">{contact.title}</div>
                    )}
                  </td>
                  <td className="px-3 py-2 text-sm">{contact.company || '-'}</td>
                  <td className="px-3 py-2 text-sm">
                    {contact.email ? (
                      <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline">
                        {contact.email}
                      </a>
                    ) : '-'}
                  </td>
                  <td className="px-3 py-2 text-sm">{formatPhoneNumber(contact.phone) || '-'}</td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-sm ${statusClassMap[contact.status] || statusClassMap.default}`}>
                      <span>{statusDisplay.emoji}</span>
                      <span>{statusDisplay.label}</span>
                    </span>
                  </td>
                  <td className="px-3 py-2 text-sm">
                    {ocrConfidence !== undefined ? (
                      <span className={ocrConfidence < 0.7 ? 'text-red-600' : 'text-green-600'}>
                        {(ocrConfidence * 100).toFixed(0)}%
                      </span>
                    ) : '-'}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <Link
                        to={`/contacts/${contact.id}/edit`}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(contact.id)}
                        className="text-sm text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}