import React, { useState } from 'react';
import { useLeadGroups, useBulkAssignContacts } from '../api/lead-groups.api';
import { Button } from '../../../shared/ui/Button';
import { LoadingSpinner } from '../../../shared/ui/LoadingSpinner';

interface BulkGroupAssignmentProps {
  selectedContactIds: number[];
  onSuccess?: () => void;
  onClose?: () => void;
}

export const BulkGroupAssignment: React.FC<BulkGroupAssignmentProps> = ({
  selectedContactIds,
  onSuccess,
  onClose
}) => {
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const { data: groups = [], isLoading: groupsLoading } = useLeadGroups();
  const bulkAssign = useBulkAssignContacts();

  const handleGroupSelect = (groupId: number) => {
    setSelectedGroupIds(prev => 
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const handleSelectAll = () => {
    if (selectedGroupIds.length === groups.length) {
      setSelectedGroupIds([]);
    } else {
      setSelectedGroupIds(groups.map(g => g.id));
    }
  };

  const handleAssign = async () => {
    if (selectedGroupIds.length === 0 || selectedContactIds.length === 0) return;

    try {
      const result = await bulkAssign.mutateAsync({
        group_ids: selectedGroupIds,
        contact_ids: selectedContactIds
      });

      // Show success message
      const { summary } = result;
      alert(
        `Successfully assigned contacts:\n` +
        `• ${summary.total_assigned} new assignments made\n` +
        `• ${summary.total_skipped} contacts were already in groups\n` +
        `• Processed ${summary.groups_processed} groups`
      );

      setSelectedGroupIds([]);
      setIsOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error('Failed to assign contacts to groups:', error);
      alert('Failed to assign contacts to groups. Please try again.');
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setSelectedGroupIds([]);
    onClose?.();
  };

  if (selectedContactIds.length === 0) {
    return null;
  }

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setIsOpen(true)}
        disabled={selectedContactIds.length === 0}
      >
        Assign to Groups ({selectedContactIds.length})
      </Button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Assign to Lead Groups
                </h2>
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-600"
                  disabled={bulkAssign.isPending}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <p className="mt-2 text-sm text-gray-600">
                Select lead groups to assign {selectedContactIds.length} contact{selectedContactIds.length !== 1 ? 's' : ''} to.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-6" style={{ maxHeight: '50vh' }}>
              {groupsLoading ? (
                <div className="flex justify-center items-center py-8">
                  <LoadingSpinner />
                </div>
              ) : groups.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No lead groups</h3>
                  <p className="text-gray-500 mb-4">
                    Create a lead group first to assign contacts to it.
                  </p>
                  <Button variant="outline" onClick={handleClose}>
                    Close
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedGroupIds.length === groups.length && groups.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        disabled={bulkAssign.isPending}
                      />
                      <span className="text-sm text-gray-700">
                        Select All Groups
                      </span>
                    </label>
                    
                    {selectedGroupIds.length > 0 && (
                      <span className="text-sm text-gray-500">
                        {selectedGroupIds.length} selected
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    {groups.map((group) => (
                      <label
                        key={group.id}
                        className={`flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                          selectedGroupIds.includes(group.id) ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedGroupIds.includes(group.id)}
                          onChange={() => handleGroupSelect(group.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                          disabled={bulkAssign.isPending}
                        />
                        
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{group.name}</div>
                          {group.description && (
                            <div className="text-sm text-gray-500 mt-1">{group.description}</div>
                          )}
                          <div className="text-sm text-gray-500 mt-1">
                            {group.contact_count} contact{group.contact_count !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="p-6 border-t border-gray-200">
              {bulkAssign.error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">
                    {bulkAssign.error.message || 'Failed to assign contacts'}
                  </p>
                </div>
              )}
              
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  disabled={bulkAssign.isPending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAssign}
                  disabled={selectedGroupIds.length === 0 || bulkAssign.isPending || groups.length === 0}
                >
                  {bulkAssign.isPending ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Assigning...
                    </>
                  ) : (
                    `Assign to ${selectedGroupIds.length} Group${selectedGroupIds.length !== 1 ? 's' : ''}`
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};