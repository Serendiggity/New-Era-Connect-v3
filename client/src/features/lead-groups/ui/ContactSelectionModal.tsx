import React, { useState, useMemo } from 'react';
import { useAvailableContacts, useAssignContacts } from '../api/lead-groups.api';
import { Button } from '../../../shared/ui/Button';
import { LoadingSpinner } from '../../../shared/ui/LoadingSpinner';
import { filterContacts, getStatusBadgeColor, getStatusDisplayName } from '../lib/lead-groups.utils';
import type { Contact } from '../api/lead-groups.api';

interface ContactSelectionModalProps {
  groupId: number;
  onClose: () => void;
}

export const ContactSelectionModal: React.FC<ContactSelectionModalProps> = ({
  groupId,
  onClose
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<number[]>([]);
  
  const { data: availableContacts = [], isLoading } = useAvailableContacts(groupId, searchTerm);
  const assignContacts = useAssignContacts();

  const handleSelectContact = (contactId: number) => {
    setSelectedContacts(prev => 
      prev.includes(contactId)
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const handleSelectAll = () => {
    if (selectedContacts.length === availableContacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(availableContacts.map(c => c.id));
    }
  };

  const handleAssignContacts = async () => {
    if (selectedContacts.length === 0) return;

    try {
      await assignContacts.mutateAsync({
        groupId,
        contactIds: selectedContacts
      });
      onClose();
    } catch (error) {
      console.error('Failed to assign contacts:', error);
      alert('Failed to assign contacts. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Add Contacts to Group
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              disabled={assignContacts.isPending}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="mt-4">
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              disabled={assignContacts.isPending}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6" style={{ maxHeight: '60vh' }}>
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner />
            </div>
          ) : availableContacts.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'No matching contacts' : 'No available contacts'}
              </h3>
              <p className="text-gray-500">
                {searchTerm 
                  ? `No contacts match your search for "${searchTerm}"`
                  : 'All contacts are already assigned to this group'
                }
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedContacts.length === availableContacts.length && availableContacts.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    disabled={assignContacts.isPending}
                  />
                  <span className="text-sm text-gray-700">
                    Select All ({availableContacts.length})
                  </span>
                </label>
                
                {selectedContacts.length > 0 && (
                  <span className="text-sm text-gray-500">
                    {selectedContacts.length} selected
                  </span>
                )}
              </div>

              <div className="space-y-3">
                {availableContacts.map((contact) => (
                  <div
                    key={contact.id}
                    className={`p-4 border rounded-lg hover:bg-gray-50 cursor-pointer ${
                      selectedContacts.includes(contact.id) ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
                    }`}
                    onClick={() => handleSelectContact(contact.id)}
                  >
                    <div className="flex items-center space-x-4">
                      <input
                        type="checkbox"
                        checked={selectedContacts.includes(contact.id)}
                        onChange={() => handleSelectContact(contact.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        disabled={assignContacts.isPending}
                      />
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h4 className="font-medium text-gray-900">{contact.fullName}</h4>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(contact.status)}`}>
                            {getStatusDisplayName(contact.status)}
                          </span>
                        </div>
                        
                        <div className="mt-1 text-sm text-gray-500 space-y-1">
                          {contact.email && (
                            <div className="flex items-center space-x-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              <span>{contact.email}</span>
                            </div>
                          )}
                          
                          {contact.company && (
                            <div className="flex items-center space-x-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                              <span>{contact.company}</span>
                              {contact.title && <span>• {contact.title}</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="p-6 border-t border-gray-200">
          {assignContacts.error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">
                {assignContacts.error.message || 'Failed to assign contacts'}
              </p>
            </div>
          )}
          
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={assignContacts.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssignContacts}
              disabled={selectedContacts.length === 0 || assignContacts.isPending}
            >
              {assignContacts.isPending ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Assigning...
                </>
              ) : (
                `Add ${selectedContacts.length} Contact${selectedContacts.length !== 1 ? 's' : ''}`
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};