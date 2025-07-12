import React, { useState, useEffect } from 'react';
import { Button } from '../../../shared/ui/Button';
import { useCreateLeadGroup, useUpdateLeadGroup } from '../api/lead-groups.api';
import { validateGroupName } from '../lib/lead-groups.utils';
import type { LeadGroup } from '../api/lead-groups.api';

interface LeadGroupFormProps {
  group?: LeadGroup | null;
  onClose: () => void;
  existingGroups?: LeadGroup[];
}

export const LeadGroupForm: React.FC<LeadGroupFormProps> = ({
  group,
  onClose,
  existingGroups = []
}) => {
  const [name, setName] = useState(group?.name || '');
  const [description, setDescription] = useState(group?.description || '');
  const [nameError, setNameError] = useState<string | null>(null);

  const createGroup = useCreateLeadGroup();
  const updateGroup = useUpdateLeadGroup();

  const isEditing = !!group;
  const isLoading = createGroup.isPending || updateGroup.isPending;

  useEffect(() => {
    if (group) {
      setName(group.name);
      setDescription(group.description || '');
    }
  }, [group]);

  const validateForm = () => {
    const existingNames = existingGroups.map(g => g.name);
    const currentName = isEditing ? group?.name : undefined;
    const error = validateGroupName(name, existingNames, currentName);
    setNameError(error);
    return !error;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      if (isEditing && group) {
        await updateGroup.mutateAsync({
          id: group.id,
          name: name.trim(),
          description: description.trim() || undefined,
        });
      } else {
        await createGroup.mutateAsync({
          name: name.trim(),
          description: description.trim() || undefined,
        });
      }
      onClose();
    } catch (error) {
      console.error('Failed to save group:', error);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    if (nameError) {
      setNameError(null);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {isEditing ? 'Edit Lead Group' : 'Create New Lead Group'}
        </h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
          disabled={isLoading}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Group Name *
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={handleNameChange}
            placeholder="Enter group name"
            className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
              nameError ? 'border-red-300' : 'border-gray-300'
            }`}
            disabled={isLoading}
            maxLength={255}
            required
          />
          {nameError && (
            <p className="mt-1 text-sm text-red-600">{nameError}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            {name.length}/255 characters
          </p>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description for this group"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            disabled={isLoading}
          />
          <p className="mt-1 text-xs text-gray-500">
            Describe the purpose or criteria for this lead group
          </p>
        </div>

        {(createGroup.error || updateGroup.error) && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">
              {createGroup.error?.message || updateGroup.error?.message || 'An error occurred'}
            </p>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading || !name.trim()}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {isEditing ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              isEditing ? 'Update Group' : 'Create Group'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};