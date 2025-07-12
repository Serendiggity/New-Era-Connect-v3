import * as React from 'react';
import { Event } from '@business-card-manager/shared';
import { EventCard } from './EventCard';
import { LoadingSpinner } from '../../../shared/ui/LoadingSpinner';
import { Button } from '../../../shared/ui/Button';
import { Plus, Search, Grid3X3, List, Calendar } from 'lucide-react';
import { sortEventsByDate, filterEventsBySearch } from '../lib/events.utils';

interface EventListProps {
  events?: Event[];
  isLoading?: boolean;
  error?: Error | null;
  onCreateEvent?: () => void;
  onEditEvent?: (event: Event) => void;
  onDeleteEvent?: (event: Event) => void;
  onViewEvent?: (event: Event) => void;
}

type ViewMode = 'grid' | 'list';
type SortMode = 'date' | 'name' | 'created';

export function EventList({
  events = [],
  isLoading = false,
  error,
  onCreateEvent,
  onEditEvent,
  onDeleteEvent,
  onViewEvent,
}: EventListProps) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [viewMode, setViewMode] = React.useState<ViewMode>('grid');
  const [sortMode, setSortMode] = React.useState<SortMode>('date');

  // Filter and sort events
  const filteredEvents = React.useMemo(() => {
    let filtered = filterEventsBySearch(events, searchTerm);
    
    switch (sortMode) {
      case 'date':
        filtered = sortEventsByDate(filtered);
        break;
      case 'name':
        filtered = filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'created':
        filtered = filtered.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        break;
    }
    
    return filtered;
  }, [events, searchTerm, sortMode]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-red-500 text-center">
          <h3 className="text-lg font-semibold mb-2">Error loading events</h3>
          <p className="text-sm text-gray-600 mb-4">{error.message}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Events</h1>
          <p className="text-gray-600">
            Manage your networking events and contacts
          </p>
        </div>
        <Button onClick={onCreateEvent} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Event
        </Button>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Sort */}
        <select
          value={sortMode}
          onChange={(e) => setSortMode(e.target.value as SortMode)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="date">Sort by Date</option>
          <option value="name">Sort by Name</option>
          <option value="created">Sort by Created</option>
        </select>

        {/* View Mode */}
        <div className="flex border border-gray-300 rounded-md overflow-hidden">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-2 ${
              viewMode === 'grid'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Grid3X3 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-2 border-l border-gray-300 ${
              viewMode === 'list'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredEvents.length === 0 && !searchTerm && (
        <div className="flex flex-col items-center justify-center py-12">
          <Calendar className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No events yet
          </h3>
          <p className="text-gray-600 text-center mb-6">
            Create your first event to start managing contacts and leads
          </p>
          <Button onClick={onCreateEvent} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Your First Event
          </Button>
        </div>
      )}

      {/* No Search Results */}
      {!isLoading && filteredEvents.length === 0 && searchTerm && (
        <div className="flex flex-col items-center justify-center py-12">
          <Search className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No events found
          </h3>
          <p className="text-gray-600 text-center mb-4">
            No events match your search for "{searchTerm}"
          </p>
          <Button 
            variant="outline" 
            onClick={() => setSearchTerm('')}
          >
            Clear Search
          </Button>
        </div>
      )}

      {/* Events Grid/List */}
      {!isLoading && filteredEvents.length > 0 && (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
          }
        >
          {filteredEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onEdit={onEditEvent}
              onDelete={onDeleteEvent}
              onView={onViewEvent}
              className={viewMode === 'list' ? 'max-w-none' : ''}
            />
          ))}
        </div>
      )}

      {/* Results Count */}
      {!isLoading && filteredEvents.length > 0 && (
        <div className="text-sm text-gray-500 text-center">
          Showing {filteredEvents.length} of {events.length} events
        </div>
      )}
    </div>
  );
}