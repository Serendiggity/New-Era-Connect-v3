import { LeadGroup, Contact } from '../api/lead-groups.api';

/**
 * Formats the contact count for display
 */
export const formatContactCount = (count: number): string => {
  if (count === 0) return 'No contacts';
  if (count === 1) return '1 contact';
  return `${count} contacts`;
};

/**
 * Generates a suggested name for duplicating a group
 */
export const generateDuplicateName = (originalName: string, existingNames: string[]): string => {
  let counter = 1;
  let suggestedName = `${originalName} (Copy)`;
  
  while (existingNames.includes(suggestedName)) {
    counter++;
    suggestedName = `${originalName} (Copy ${counter})`;
  }
  
  return suggestedName;
};

/**
 * Validates a group name
 */
export const validateGroupName = (name: string, existingNames: string[] = [], currentName?: string): string | null => {
  if (!name.trim()) {
    return 'Group name is required';
  }
  
  if (name.length > 255) {
    return 'Group name must be less than 255 characters';
  }
  
  // Check for duplicates (excluding current name when editing)
  if (existingNames.includes(name) && name !== currentName) {
    return 'A group with this name already exists';
  }
  
  return null;
};

/**
 * Filters contacts based on search criteria
 */
export const filterContacts = (contacts: Contact[], searchTerm: string): Contact[] => {
  if (!searchTerm.trim()) return contacts;
  
  const search = searchTerm.toLowerCase();
  return contacts.filter(contact =>
    contact.fullName.toLowerCase().includes(search) ||
    contact.email?.toLowerCase().includes(search) ||
    contact.company?.toLowerCase().includes(search) ||
    contact.title?.toLowerCase().includes(search)
  );
};

/**
 * Groups contacts by their status for display
 */
export const groupContactsByStatus = (contacts: Contact[]): Record<string, Contact[]> => {
  return contacts.reduce((groups, contact) => {
    const status = contact.status || 'unknown';
    if (!groups[status]) {
      groups[status] = [];
    }
    groups[status].push(contact);
    return groups;
  }, {} as Record<string, Contact[]>);
};

/**
 * Gets a user-friendly status display name
 */
export const getStatusDisplayName = (status: string): string => {
  const statusMap: Record<string, string> = {
    processing: 'Processing',
    completed: 'Completed',
    failed: 'Failed',
    pending_review: 'Needs Review',
    user_verified: 'Verified',
  };
  
  return statusMap[status] || status;
};

/**
 * Gets the appropriate status badge color
 */
export const getStatusBadgeColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    processing: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    pending_review: 'bg-yellow-100 text-yellow-800',
    user_verified: 'bg-purple-100 text-purple-800',
  };
  
  return colorMap[status] || 'bg-gray-100 text-gray-800';
};

/**
 * Sorts groups by various criteria
 */
export const sortGroups = (groups: LeadGroup[], sortBy: 'name' | 'created' | 'size' | 'updated'): LeadGroup[] => {
  return [...groups].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'created':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'updated':
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      case 'size':
        return b.contact_count - a.contact_count;
      default:
        return 0;
    }
  });
};

/**
 * Sorts contacts by various criteria
 */
export const sortContacts = (contacts: Contact[], sortBy: 'name' | 'company' | 'added' | 'status'): Contact[] => {
  return [...contacts].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.fullName.localeCompare(b.fullName);
      case 'company':
        return (a.company || '').localeCompare(b.company || '');
      case 'added':
        if (a.added_at && b.added_at) {
          return new Date(b.added_at).getTime() - new Date(a.added_at).getTime();
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'status':
        return a.status.localeCompare(b.status);
      default:
        return 0;
    }
  });
};

/**
 * Formats a date for display
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Formats a date with time for display
 */
export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Formats the relative time (e.g., "2 days ago")
 */
export const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  
  return formatDate(dateString);
};

/**
 * Calculates statistics for a group
 */
export const calculateGroupStats = (contacts: Contact[]) => {
  const total = contacts.length;
  const statusCounts = groupContactsByStatus(contacts);
  
  return {
    total,
    verified: (statusCounts.user_verified || []).length,
    needsReview: (statusCounts.pending_review || []).length,
    completed: (statusCounts.completed || []).length,
    processing: (statusCounts.processing || []).length,
    failed: (statusCounts.failed || []).length,
  };
};

/**
 * Generates a CSV export format for contacts in a group
 */
export const generateCSVData = (contacts: Contact[], groupName: string): string => {
  const headers = [
    'Group',
    'Full Name',
    'Email',
    'Company',
    'Title',
    'Phone',
    'LinkedIn URL',
    'Status',
    'Added Date'
  ];
  
  const rows = contacts.map(contact => [
    groupName,
    contact.fullName,
    contact.email || '',
    contact.company || '',
    contact.title || '',
    contact.phone || '',
    contact.linkedinUrl || '',
    getStatusDisplayName(contact.status),
    contact.added_at ? formatDate(contact.added_at) : formatDate(contact.createdAt)
  ]);
  
  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${field.replace(/"/g, '""')}"`).join(','))
    .join('\n');
  
  return csvContent;
};

/**
 * Downloads CSV data as a file
 */
export const downloadCSV = (csvData: string, filename: string): void => {
  const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};