/**
 * Format a date string to a human-readable format
 */
export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  } catch {
    return dateString;
  }
}

/**
 * Format a date string to a short format (MM/DD/YYYY)
 */
export function formatDateShort(dateString: string): string {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  } catch {
    return dateString;
  }
}

/**
 * Format a date string to show relative time (e.g., "3 days ago", "in 2 weeks")
 */
export function formatRelativeDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = date.getTime() - now.getTime();
    const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return 'Today';
    } else if (diffInDays === 1) {
      return 'Tomorrow';
    } else if (diffInDays === -1) {
      return 'Yesterday';
    } else if (diffInDays > 0) {
      if (diffInDays <= 7) {
        return `In ${diffInDays} days`;
      } else if (diffInDays <= 30) {
        const weeks = Math.floor(diffInDays / 7);
        return `In ${weeks} week${weeks > 1 ? 's' : ''}`;
      } else {
        const months = Math.floor(diffInDays / 30);
        return `In ${months} month${months > 1 ? 's' : ''}`;
      }
    } else {
      const absDays = Math.abs(diffInDays);
      if (absDays <= 7) {
        return `${absDays} days ago`;
      } else if (absDays <= 30) {
        const weeks = Math.floor(absDays / 7);
        return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
      } else {
        const months = Math.floor(absDays / 30);
        return `${months} month${months > 1 ? 's' : ''} ago`;
      }
    }
  } catch {
    return 'Unknown date';
  }
}

/**
 * Check if an event date is in the past
 */
export function isEventPast(dateString: string): boolean {
  try {
    const eventDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    return eventDate < today;
  } catch {
    return false;
  }
}

/**
 * Check if an event date is today
 */
export function isEventToday(dateString: string): boolean {
  try {
    const eventDate = new Date(dateString);
    const today = new Date();
    return (
      eventDate.getFullYear() === today.getFullYear() &&
      eventDate.getMonth() === today.getMonth() &&
      eventDate.getDate() === today.getDate()
    );
  } catch {
    return false;
  }
}

/**
 * Check if an event date is upcoming (within next 30 days)
 */
export function isEventUpcoming(dateString: string): boolean {
  try {
    const eventDate = new Date(dateString);
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    return eventDate >= today && eventDate <= thirtyDaysFromNow;
  } catch {
    return false;
  }
}

/**
 * Sort events by date (ascending)
 */
export function sortEventsByDate<T extends { date: string }>(events: T[]): T[] {
  return [...events].sort((a, b) => {
    try {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    } catch {
      return 0;
    }
  });
}

/**
 * Filter events by search term (searches name, location, industry, description)
 */
export function filterEventsBySearch<T extends {
  name: string;
  location?: string;
  industry?: string;
  description?: string;
}>(events: T[], searchTerm: string): T[] {
  if (!searchTerm.trim()) {
    return events;
  }

  const term = searchTerm.toLowerCase();
  return events.filter(event => 
    event.name.toLowerCase().includes(term) ||
    event.location?.toLowerCase().includes(term) ||
    event.industry?.toLowerCase().includes(term) ||
    event.description?.toLowerCase().includes(term)
  );
}