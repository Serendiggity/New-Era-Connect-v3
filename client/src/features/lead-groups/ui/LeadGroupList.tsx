import React, { useState, useMemo } from 'react';
import { useLeadGroups } from '../api/lead-groups.api';
import { LeadGroupCard } from './LeadGroupCard';
import { LeadGroupForm } from './LeadGroupForm';
import { LoadingSpinner } from '../../../shared/ui/LoadingSpinner';
import { Button } from '../../../shared/ui/Button';
import { sortGroups } from '../lib/lead-groups.utils';
import type { LeadGroup } from '../api/lead-groups.api';

interface LeadGroupListProps {
  searchTerm?: string;
}

type SortOption = 'name' | 'created' | 'size' | 'updated';

export const LeadGroupList: React.FC<LeadGroupListProps> = ({ searchTerm = '' }) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState<LeadGroup | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('updated');
  
  const { data: groups = [], isLoading, error } = useLeadGroups({ 
    search: searchTerm || undefined 
  });

  const sortedGroups = useMemo(() => {
    return sortGroups(groups, sortBy);
  }, [groups, sortBy]);

  const handleEdit = (group: LeadGroup) => {
    setEditingGroup(group);
  };

  const handleCloseForm = () => {
    setShowCreateForm(false);
    setEditingGroup(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium">Failed to load lead groups</h3>
          <p className="text-sm text-gray-500 mt-1">
            {error instanceof Error ? error.message : 'An unexpected error occurred'}
          </p>
        </div>
        <Button 
          onClick={() => window.location.reload()} 
          variant="outline"
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (groups.length === 0 && !searchTerm) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-6">
          <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No lead groups yet</h3>
          <p className="text-gray-500 mb-6">
            Create your first lead group to organize contacts for targeted campaigns
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          Create Your First Group
        </Button>
      </div>
    );
  }

  if (groups.length === 0 && searchTerm) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-6">
          <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No groups found</h3>
          <p className="text-gray-500">
            No lead groups match your search for "{searchTerm}"
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Sort Options */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-medium text-gray-900">
            {groups.length} {groups.length === 1 ? 'Group' : 'Groups'}
          </h2>
          
          <div className="flex items-center space-x-2">
            <label htmlFor="sort" className="text-sm text-gray-500">
              Sort by:
            </label>
            <select
              id="sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="updated">Last Updated</option>
              <option value="created">Date Created</option>
              <option value="name">Name</option>
              <option value="size">Group Size</option>
            </select>
          </div>
        </div>

        <Button onClick={() => setShowCreateForm(true)}>
          New Group
        </Button>
      </div>

      {/* Groups Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sortedGroups.map((group) => (
          <LeadGroupCard
            key={group.id}
            group={group}
            allGroups={groups}
            onEdit={handleEdit}
          />
        ))}
      </div>

      {/* Create/Edit Form Modal */}
      {(showCreateForm || editingGroup) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <LeadGroupForm
              group={editingGroup}
              onClose={handleCloseForm}
              existingGroups={groups}
            />
          </div>
        </div>
      )}
    </div>
  );
};