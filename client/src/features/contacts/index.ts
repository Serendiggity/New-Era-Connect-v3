// UI Components
export { ContactList } from './ui/ContactList';
export { ContactCard } from './ui/ContactCard';
export { ContactForm } from './ui/ContactForm';
export { ContactDetail } from './ui/ContactDetail';

// API Hooks
export {
  useContacts,
  useContact,
  useContactStats,
  useCreateContact,
  useUpdateContact,
  useDeleteContact,
  useBulkUpdateContactStatus,
  useProcessOcrResult,
  contactsKeys,
} from './api/contacts.api';
export type { ContactFilters, ContactStats } from './api/contacts.api';

// Utilities
export {
  contactStatusConfig,
  getContactStatusDisplay,
  formatPhoneNumber,
  getContactDisplayName,
  getContactInitials,
  isContactNeedsReview,
} from './lib/contacts.utils';