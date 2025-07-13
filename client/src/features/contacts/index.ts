// UI Components
export { ContactList } from './ui/ContactList';
export { ContactCard } from './ui/ContactCard';
export { ContactForm } from './ui/ContactForm';
export { ContactDetail } from './ui/ContactDetail';
export { BusinessCardUpload } from './ui/BusinessCardUpload';
export { BulkBusinessCardUpload } from './ui/BulkBusinessCardUpload';
export { OcrReviewModal } from './ui/OcrReviewModal';

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
  useUploadBusinessCard,
  useUploadBusinessCardForContact,
  useOcrJobs,
  useProcessPendingOcrJobs,
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