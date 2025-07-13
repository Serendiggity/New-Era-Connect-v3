import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ContactList, useContactStats } from '../../features/contacts';
import { Button, LoadingSpinner } from '../../shared/ui';
import { CheckCircle, X } from 'lucide-react';

export default function ContactsPage() {
  const { data: stats, isLoading: statsLoading } = useContactStats();
  const location = useLocation();
  const [showMessage, setShowMessage] = useState(false);
  const [message, setMessage] = useState('');

  // Show success message from navigation state
  useEffect(() => {
    if (location.state?.message) {
      setMessage(location.state.message);
      setShowMessage(true);
      
      // Clear the state to prevent showing again on refresh
      window.history.replaceState({}, '', location.pathname);
      
      // Auto-hide after 5 seconds
      setTimeout(() => setShowMessage(false), 5000);
    }
  }, [location]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold">Contacts</h1>
          <div className="flex gap-2">
            <Link to="/contacts/bulk-upload">
              <Button variant="secondary">Bulk Upload</Button>
            </Link>
            <Link to="/contacts/new">
              <Button>Add Contact</Button>
            </Link>
          </div>
        </div>

        {/* Success message */}
        {showMessage && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-green-800">{message}</span>
            </div>
            <button
              onClick={() => setShowMessage(false)}
              className="text-green-600 hover:text-green-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Stats cards */}
        {statsLoading ? (
          <LoadingSpinner />
        ) : stats ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Contacts</div>
            </div>
            <div className="bg-green-50 rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-green-600">
                {stats.byStatus.user_verified || 0}
              </div>
              <div className="text-sm text-gray-600">Verified</div>
            </div>
            <div className="bg-yellow-50 rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-yellow-600">
                {stats.needsReview}
              </div>
              <div className="text-sm text-gray-600">Needs Review</div>
            </div>
            <div className="bg-blue-50 rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-blue-600">
                {stats.byStatus.processing || 0}
              </div>
              <div className="text-sm text-gray-600">Processing</div>
            </div>
          </div>
        ) : null}
      </div>

      <ContactList />
    </div>
  );
}