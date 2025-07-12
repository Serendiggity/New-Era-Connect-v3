import React, { useState } from 'react';
import { LeadGroupList, useLeadGroupStats } from '../../features/lead-groups';
import { Card } from '../../shared/ui/Card';
import { LoadingSpinner } from '../../shared/ui/LoadingSpinner';

export default function LeadGroupsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: stats, isLoading: statsLoading } = useLeadGroupStats();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Lead Groups</h1>
          <p className="mt-2 text-gray-600">
            Organize your contacts into targeted groups for email campaigns
          </p>
        </div>

        {/* Stats Overview */}
        {statsLoading ? (
          <div className="flex justify-center py-4">
            <LoadingSpinner />
          </div>
        ) : stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="text-2xl font-bold text-gray-900">{stats.totalGroups}</div>
              <div className="text-sm text-gray-500">Total Groups</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-blue-600">{stats.totalAssignments}</div>
              <div className="text-sm text-gray-500">Total Assignments</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-gray-600">{stats.emptyGroups}</div>
              <div className="text-sm text-gray-500">Empty Groups</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-green-600">{stats.averageSize}</div>
              <div className="text-sm text-gray-500">Avg Group Size</div>
            </Card>
          </div>
        )}

        {/* Search */}
        <div>
          <input
            type="text"
            placeholder="Search lead groups..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Lead Groups List */}
        <LeadGroupList searchTerm={searchTerm} />
      </div>
    </div>
  );
}