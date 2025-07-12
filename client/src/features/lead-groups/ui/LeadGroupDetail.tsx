import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { 
  useLeadGroupWithContacts, 
  useDeleteLeadGroup, 
  useRemoveContacts,
  useDuplicateLeadGroup 
} from '../api/lead-groups.api';
import { ContactSelectionModal } from './ContactSelectionModal';
import { LeadGroupForm } from './LeadGroupForm';
import { LoadingSpinner } from '../../../shared/ui/LoadingSpinner';
import { Button } from '../../../shared/ui/Button';
import { Card } from '../../../shared/ui/Card';
import {
  formatContactCount,
  formatRelativeTime,
  getStatusBadgeColor,
  getStatusDisplayName,
  sortContacts,
  calculateGroupStats,
  generateCSVData,
  downloadCSV,
  generateDuplicateName
} from '../lib/lead-groups.utils';
import type { Contact } from '../api/lead-groups.api';

type SortOption = 'name' | 'company' | 'added' | 'status';

export const LeadGroupDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const groupId = parseInt(id || '0', 10);

  const [showEditForm, setShowEditForm] = useState(false);
  const [showAddContacts, setShowAddContacts] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('added');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: group, isLoading, error } = useLeadGroupWithContacts(groupId);
  const deleteGroup = useDeleteLeadGroup();
  const removeContacts = useRemoveContacts();
  const duplicateGroup = useDuplicateLeadGroup();

  const handleDelete = async () => {
    if (!group) return;
    
    const confirmed = confirm(
      `Are you sure you want to delete "${group.name}"? This will remove all contact associations and cannot be undone.`
    );
    
    if (!confirmed) return;

    try {
      await deleteGroup.mutateAsync(group.id);
      navigate('/lead-groups');
    } catch (error) {
      console.error('Failed to delete group:', error);
      alert('Failed to delete group. Please try again.');
    }
  };

  const handleDuplicate = async () => {
    if (!group) return;
    
    const newName = prompt('Enter name for the duplicated group:', `${group.name} (Copy)`);
    if (!newName || newName.trim() === '') return;

    try {
      const duplicated = await duplicateGroup.mutateAsync({ 
        id: group.id, 
        name: newName.trim() 
      });
      navigate(`/lead-groups/${duplicated.id}`);
    } catch (error) {
      console.error('Failed to duplicate group:', error);
      alert('Failed to duplicate group. Please try again.');
    }
  };

  const handleRemoveContacts = async () => {
    if (selectedContacts.length === 0) return;
    
    const confirmed = confirm(
      `Remove ${selectedContacts.length} contact${selectedContacts.length > 1 ? 's' : ''} from this group?`
    );
    
    if (!confirmed) return;

    try {
      await removeContacts.mutateAsync({
        groupId,
        contactIds: selectedContacts
      });
      setSelectedContacts([]);
    } catch (error) {
      console.error('Failed to remove contacts:', error);
      alert('Failed to remove contacts. Please try again.');
    }
  };

  const handleExportCSV = () => {
    if (!group) return;
    
    const csvData = generateCSVData(group.contacts, group.name);
    const filename = `${group.name.replace(/[^a-zA-Z0-9]/g, '_')}_contacts.csv`;
    downloadCSV(csvData, filename);
  };

  const handleSelectContact = (contactId: number) => {
    setSelectedContacts(prev => 
      prev.includes(contactId)
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const handleSelectAll = () => {
    if (!group) return;
    
    if (selectedContacts.length === group.contacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(group.contacts.map(c => c.id));
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium">Group not found</h3>
          <p className="text-sm text-gray-500 mt-1">
            The lead group you're looking for doesn't exist or has been deleted.
          </p>
        </div>
        <Link to="/lead-groups">
          <Button variant="outline">Back to Lead Groups</Button>
        </Link>
      </div>
    );
  }

  const filteredContacts = group.contacts.filter(contact =>
    contact.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedContacts = sortContacts(filteredContacts, sortBy);
  const stats = calculateGroupStats(group.contacts);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <Link 
              to="/lead-groups"
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
          </div>
          
          {group.description && (
            <p className="text-gray-600 max-w-2xl">{group.description}</p>
          )}
          
          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
            <span>{formatContactCount(group.contact_count)}</span>
            <span>•</span>
            <span>Updated {formatRelativeTime(group.updatedAt)}</span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Button 
            variant="outline" 
            onClick={() => setShowAddContacts(true)}
          >
            Add Contacts
          </Button>
          
          <div className="relative">
            <Button variant="outline" className="px-3">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </Button>
            
            {/* Dropdown menu would go here */}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-500">Total Contacts</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-green-600">{stats.verified}</div>
          <div className="text-sm text-gray-500">Verified</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-yellow-600">{stats.needsReview}</div>
          <div className="text-sm text-gray-500">Needs Review</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-blue-600">{stats.completed}</div>
          <div className="text-sm text-gray-500">Completed</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-gray-600">{stats.processing}</div>
          <div className="text-sm text-gray-500">Processing</div>
        </Card>
      </div>

      {/* Contacts Section */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium text-gray-900">
              Contacts ({group.contacts.length})
            </h2>
            
            <div className="flex items-center space-x-4">
              {selectedContacts.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">
                    {selectedContacts.length} selected
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveContacts}
                    disabled={removeContacts.isPending}
                  >
                    Remove Selected
                  </Button>
                </div>
              )}
              
              {group.contacts.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportCSV}
                >
                  Export CSV
                </Button>
              )}
            </div>
          </div>

          {group.contacts.length > 0 && (
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <input
                  type="text"
                  placeholder="Search contacts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="added">Date Added</option>
                  <option value="name">Name</option>
                  <option value="company">Company</option>
                  <option value="status">Status</option>
                </select>
              </div>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedContacts.length === group.contacts.length && group.contacts.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Select All</span>
              </label>
            </div>
          )}

          {group.contacts.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No contacts yet</h3>
              <p className="text-gray-500 mb-4">
                Add contacts to this group to start organizing your leads
              </p>
              <Button onClick={() => setShowAddContacts(true)}>
                Add Contacts
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedContacts.map((contact) => (
                <div
                  key={contact.id}
                  className={`p-4 border rounded-lg hover:bg-gray-50 ${
                    selectedContacts.includes(contact.id) ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <input
                        type="checkbox"
                        checked={selectedContacts.includes(contact.id)}
                        onChange={() => handleSelectContact(contact.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
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

                    <div className="text-right text-sm text-gray-500">
                      {contact.added_at && (
                        <div>Added {formatRelativeTime(contact.added_at)}</div>
                      )}
                      <Link
                        to={`/contacts/${contact.id}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Modals */}
      {showEditForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <LeadGroupForm
              group={group}
              onClose={() => setShowEditForm(false)}
            />
          </div>
        </div>
      )}

      {showAddContacts && (
        <ContactSelectionModal
          groupId={groupId}
          onClose={() => setShowAddContacts(false)}
        />
      )}
    </div>
  );
};