import React from 'react';
import { Link } from 'react-router-dom';
import { ContactList, useContactStats } from '../../features/contacts';
import { Button, LoadingSpinner } from '../../shared/ui';

export default function ContactsPage() {
  const { data: stats, isLoading: statsLoading } = useContactStats();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold">Contacts</h1>
          <Link to="/contacts/new">
            <Button>Add Contact</Button>
          </Link>
        </div>

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