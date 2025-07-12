import type { ContactStatus } from '../../../../../shared/src/types/contact';

export const contactStatusConfig: Record<ContactStatus, { label: string; color: string; emoji: string }> = {
  processing: {
    label: 'Processing',
    color: 'blue',
    emoji: '⏳',
  },
  completed: {
    label: 'Completed',
    color: 'green',
    emoji: '🟢',
  },
  failed: {
    label: 'Failed',
    color: 'red',
    emoji: '❌',
  },
  pending_review: {
    label: 'Needs Review',
    color: 'yellow',
    emoji: '🟡',
  },
  user_verified: {
    label: 'Verified',
    color: 'green',
    emoji: '✅',
  },
};

export function getContactStatusDisplay(status: ContactStatus) {
  return contactStatusConfig[status] || {
    label: status,
    color: 'gray',
    emoji: '❓',
  };
}

export function formatPhoneNumber(phone?: string): string {
  if (!phone) return '';
  
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format as (XXX) XXX-XXXX for US numbers
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  
  // Return original if not a standard US number
  return phone;
}

export function getContactDisplayName(contact: { full_name: string; company?: string; title?: string }): string {
  const parts = [contact.full_name];
  
  if (contact.title) {
    parts.push(contact.title);
  }
  
  if (contact.company) {
    parts.push(`at ${contact.company}`);
  }
  
  return parts.join(' ');
}

export function getContactInitials(fullName: string): string {
  const names = fullName.trim().split(' ');
  if (names.length === 1) {
    return names[0].substring(0, 2).toUpperCase();
  }
  return names
    .map(name => name[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
}

export function isContactNeedsReview(contact: { status: ContactStatus; ocr_confidence?: number }): boolean {
  return contact.status === 'pending_review' && (contact.ocr_confidence || 0) < 0.7;
}