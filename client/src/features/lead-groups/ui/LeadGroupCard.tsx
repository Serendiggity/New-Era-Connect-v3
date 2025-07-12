import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../../shared/ui/Card';
import { Button } from '../../../shared/ui/Button';
import { LeadGroup, useDeleteLeadGroup, useDuplicateLeadGroup } from '../api/lead-groups.api';
import { formatContactCount, formatRelativeTime, generateDuplicateName } from '../lib/lead-groups.utils';

interface LeadGroupCardProps {
  group: LeadGroup;
  allGroups?: LeadGroup[];
  onEdit?: (group: LeadGroup) => void;
}

export const LeadGroupCard: React.FC<LeadGroupCardProps> = ({ 
  group, 
  allGroups = [], 
  onEdit 
}) => {
  const [showActions, setShowActions] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteGroup = useDeleteLeadGroup();
  const duplicateGroup = useDuplicateLeadGroup();

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${group.name}"? This will remove all contact associations.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteGroup.mutateAsync(group.id);
    } catch (error) {
      console.error('Failed to delete group:', error);
      alert('Failed to delete group. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDuplicate = async () => {
    const existingNames = allGroups.map(g => g.name);
    const suggestedName = generateDuplicateName(group.name, existingNames);
    
    const newName = prompt('Enter name for the duplicated group:', suggestedName);
    if (!newName || newName.trim() === '') return;

    try {
      await duplicateGroup.mutateAsync({ id: group.id, name: newName.trim() });
    } catch (error) {
      console.error('Failed to duplicate group:', error);
      alert('Failed to duplicate group. Please try again.');
    }
  };

  const getCardColors = () => {
    if (group.contact_count === 0) {
      return 'border-gray-200 bg-gray-50';
    }
    if (group.contact_count < 5) {
      return 'border-blue-200 bg-blue-50';
    }
    if (group.contact_count < 20) {
      return 'border-green-200 bg-green-50';
    }
    return 'border-purple-200 bg-purple-50';
  };

  return (
    <Card className={`relative transition-all duration-200 hover:shadow-md ${getCardColors()}`}>
      <div 
        className="absolute top-4 right-4 cursor-pointer"
        onClick={() => setShowActions(!showActions)}
      >
        <div className="flex items-center justify-center w-6 h-6 rounded-full hover:bg-gray-200">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </div>
      </div>

      {showActions && (
        <div className="absolute top-12 right-4 bg-white border rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
          <button
            onClick={() => onEdit?.(group)}
            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
          >
            Edit
          </button>
          <button
            onClick={handleDuplicate}
            disabled={duplicateGroup.isPending}
            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 disabled:opacity-50"
          >
            {duplicateGroup.isPending ? 'Duplicating...' : 'Duplicate'}
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      )}

      <Link 
        to={`/lead-groups/${group.id}`}
        className="block p-6 hover:bg-opacity-80 transition-colors"
        onClick={() => setShowActions(false)}
      >
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
            {group.name}
          </h3>
        </div>

        {group.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {group.description}
          </p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              {formatContactCount(group.contact_count)}
            </span>
            
            {group.contact_count > 0 && (
              <div className="flex items-center">
                <svg className="w-4 h-4 text-gray-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="text-xs text-gray-500">
                  Active
                </span>
              </div>
            )}
          </div>

          <div className="text-right">
            <p className="text-xs text-gray-500">
              Updated {formatRelativeTime(group.updatedAt)}
            </p>
          </div>
        </div>

        {group.contact_count === 0 && (
          <div className="mt-4 p-3 bg-white border border-dashed border-gray-300 rounded-lg">
            <p className="text-sm text-gray-500 text-center">
              No contacts assigned yet
            </p>
            <p className="text-xs text-gray-400 text-center mt-1">
              Click to add contacts to this group
            </p>
          </div>
        )}
      </Link>
    </Card>
  );
};