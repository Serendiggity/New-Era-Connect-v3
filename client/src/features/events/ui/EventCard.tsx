import * as React from 'react';
import { Event } from '@business-card-manager/shared';
import { Card, CardContent, CardHeader, CardTitle } from '../../../shared/ui/Card';
import { Button } from '../../../shared/ui/Button';
import { Calendar, MapPin, Building2, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { formatDate, formatRelativeDate } from '../lib/events.utils';

interface EventCardProps {
  event: Event;
  onEdit?: (event: Event) => void;
  onDelete?: (event: Event) => void;
  onView?: (event: Event) => void;
  className?: string;
}

export function EventCard({ 
  event, 
  onEdit, 
  onDelete, 
  onView,
  className 
}: EventCardProps) {
  const [showActions, setShowActions] = React.useState(false);

  const handleCardClick = () => {
    onView?.(event);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(event);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(event);
  };

  const toggleActions = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowActions(!showActions);
  };

  return (
    <Card 
      className={`group cursor-pointer transition-all hover:shadow-md hover:border-primary/20 ${className}`}
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-primary">
            {event.name}
          </CardTitle>
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={toggleActions}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
            
            {showActions && (
              <div className="absolute right-0 top-8 z-10 bg-white border border-gray-200 rounded-md shadow-lg py-1 min-w-[120px]">
                <button
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                  onClick={handleEdit}
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </button>
                <button
                  className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="h-4 w-4 flex-shrink-0" />
          <span className="font-medium">{formatDate(event.date)}</span>
          <span className="text-gray-400">•</span>
          <span>{formatRelativeDate(event.date)}</span>
        </div>
        
        {event.location && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4 flex-shrink-0" />
            <span>{event.location}</span>
          </div>
        )}
        
        {event.industry && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Building2 className="h-4 w-4 flex-shrink-0" />
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
              {event.industry}
            </span>
          </div>
        )}
        
        {event.description && (
          <p className="text-sm text-gray-600 line-clamp-2">
            {event.description}
          </p>
        )}
        
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <span className="text-xs text-gray-400">
            Created {formatRelativeDate(event.created_at)}
          </span>
          
          {/* Contact count placeholder - will be implemented when contacts are ready */}
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
            0 contacts
          </span>
        </div>
      </CardContent>
    </Card>
  );
}