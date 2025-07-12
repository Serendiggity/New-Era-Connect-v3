import * as React from 'react';
import { Event } from '@business-card-manager/shared';
import { Button } from '../../../shared/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../shared/ui/Card';
import { LoadingSpinner } from '../../../shared/ui/LoadingSpinner';
import { 
  Calendar, 
  MapPin, 
  Building2, 
  Edit, 
  Trash2, 
  ArrowLeft,
  Users,
  Upload,
  Mail
} from 'lucide-react';
import { formatDate, formatRelativeDate, isEventPast } from '../lib/events.utils';
import { ScanCardTab } from './ScanCardTab';

interface EventDetailProps {
  event?: Event;
  isLoading?: boolean;
  error?: Error | null;
  onEdit?: (event: Event) => void;
  onDelete?: (event: Event) => void;
  onBack?: () => void;
  onScanCard?: (event: Event) => void;
  onViewContacts?: (event: Event) => void;
  onCreateCampaign?: (event: Event) => void;
}

export function EventDetail({
  event,
  isLoading = false,
  error,
  onEdit,
  onDelete,
  onBack,
  onScanCard,
  onViewContacts,
  onCreateCampaign,
}: EventDetailProps) {
  const [activeTab, setActiveTab] = React.useState<'details' | 'contacts' | 'scan'>('details');

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" onClick={onBack} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Events
          </Button>
        </div>
        
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-red-500 text-center">
              <h3 className="text-lg font-semibold mb-2">Error loading event</h3>
              <p className="text-sm text-gray-600 mb-4">{error.message}</p>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading || !event) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" onClick={onBack} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Events
          </Button>
        </div>
        
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleDelete = () => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${event.name}"? This action cannot be undone.`
    );
    if (confirmDelete) {
      onDelete?.(event);
    }
  };

  const isPast = isEventPast(event.date);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header with Navigation */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={onBack} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Events
        </Button>
      </div>

      {/* Event Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <CardTitle className="text-2xl">{event.name}</CardTitle>
                {isPast && (
                  <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                    Past Event
                  </span>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span className="font-medium">{formatDate(event.date)}</span>
                  <span className="text-gray-400">•</span>
                  <span>{formatRelativeDate(event.date)}</span>
                </div>
                
                {event.location && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>{event.location}</span>
                  </div>
                )}
                
                {event.industry && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Building2 className="h-4 w-4" />
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                      {event.industry}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => onEdit?.(event)}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="outline"
                onClick={handleDelete}
                className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {event.description && (
          <CardContent>
            <p className="text-gray-700">{event.description}</p>
          </CardContent>
        )}
      </Card>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'details'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Details
          </button>
          <button
            onClick={() => setActiveTab('contacts')}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'contacts'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Users className="h-4 w-4" />
            Contacts
            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
              0 {/* Will be updated when contacts are implemented */}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('scan')}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'scan'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Upload className="h-4 w-4" />
            Scan Cards
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'details' && (
          <Card>
            <CardHeader>
              <CardTitle>Event Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Event Details</h4>
                  <dl className="space-y-2 text-sm">
                    <div>
                      <dt className="text-gray-500">Name</dt>
                      <dd className="font-medium">{event.name}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Date</dt>
                      <dd className="font-medium">{formatDate(event.date)}</dd>
                    </div>
                    {event.location && (
                      <div>
                        <dt className="text-gray-500">Location</dt>
                        <dd className="font-medium">{event.location}</dd>
                      </div>
                    )}
                    {event.industry && (
                      <div>
                        <dt className="text-gray-500">Industry</dt>
                        <dd className="font-medium">{event.industry}</dd>
                      </div>
                    )}
                  </dl>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Statistics</h4>
                  <dl className="space-y-2 text-sm">
                    <div>
                      <dt className="text-gray-500">Total Contacts</dt>
                      <dd className="font-medium">0</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Cards Scanned</dt>
                      <dd className="font-medium">0</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Created</dt>
                      <dd className="font-medium">{formatRelativeDate(event.created_at)}</dd>
                    </div>
                  </dl>
                </div>
              </div>
              
              {event.description && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                  <p className="text-gray-700 text-sm">{event.description}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'contacts' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Event Contacts</CardTitle>
                <Button
                  onClick={() => onCreateCampaign?.(event)}
                  className="flex items-center gap-2"
                  disabled={true} // Will be enabled when contacts exist
                >
                  <Mail className="h-4 w-4" />
                  Create Campaign
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No contacts yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Scan business cards to add contacts to this event
                </p>
                <Button
                  onClick={() => onScanCard?.(event)}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Scan Your First Card
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'scan' && (
          <Card>
            <CardHeader>
              <CardTitle>Scan Business Cards</CardTitle>
            </CardHeader>
            <CardContent>
              <ScanCardTab eventId={event.id} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}