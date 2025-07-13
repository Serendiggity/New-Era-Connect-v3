import * as React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Navigation } from './shared/ui';
import { EventsPage } from './pages/events';
import { EventDetailPage } from './pages/events/[id]';
import { CreateEventPage } from './pages/events/new';
import { EditEventPage } from './pages/events/edit';
import ContactsPage from './pages/contacts';
import ContactDetailPage from './pages/contacts/[id]';
import NewContactPage from './pages/contacts/new';
import EditContactPage from './pages/contacts/edit';
import BulkUploadPage from './pages/contacts/bulk-upload';
import LeadGroupsPage from './pages/lead-groups';
import LeadGroupDetailPage from './pages/lead-groups/[id]';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navigation />
          <Routes>
            {/* Redirect root to events */}
            <Route path="/" element={<Navigate to="/events" replace />} />
            
            {/* Events routes */}
            <Route path="/events" element={<EventsPage />} />
            <Route path="/events/new" element={<CreateEventPage />} />
            <Route path="/events/:id" element={<EventDetailPage />} />
            <Route path="/events/:id/edit" element={<EditEventPage />} />
            
            {/* Contacts routes */}
            <Route path="/contacts" element={<ContactsPage />} />
            <Route path="/contacts/new" element={<NewContactPage />} />
            <Route path="/contacts/bulk-upload" element={<BulkUploadPage />} />
            <Route path="/contacts/:id" element={<ContactDetailPage />} />
            <Route path="/contacts/:id/edit" element={<EditContactPage />} />
            
            {/* Lead Groups routes */}
            <Route path="/lead-groups" element={<LeadGroupsPage />} />
            <Route path="/lead-groups/:id" element={<LeadGroupDetailPage />} />
            
            {/* Catch all - redirect to events */}
            <Route path="*" element={<Navigate to="/events" replace />} />
          </Routes>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;