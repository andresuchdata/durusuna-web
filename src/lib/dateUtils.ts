/**
 * Formats a date string to show relative time like WhatsApp/other messaging apps
 * - Today: show time (e.g., "2:30 PM")
 * - Yesterday: show "Yesterday"
 * - This week: show day name (e.g., "Monday")
 * - This year: show date without year (e.g., "Dec 25")
 * - Previous years: show full date (e.g., "12/25/2022")
 */
export function formatConversationTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  
  // Start of today
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Start of yesterday
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  
  // Start of this week (Sunday)
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  
  // Start of this year
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  
  // If today - show time
  if (date >= startOfToday) {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit' 
    });
  }
  
  // If yesterday - show "Yesterday"
  if (date >= startOfYesterday) {
    return 'Yesterday';
  }
  
  // If this week - show day name
  if (date >= startOfWeek) {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  }
  
  // If this year - show month and day
  if (date >= startOfYear) {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  }
  
  // Previous years - show full date
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
}

/**
 * Formats relative time for older messages (like "2 days ago", "1 week ago")
 */
export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks === 1 ? '' : 's'} ago`;
  if (diffMonths < 12) return `${diffMonths} month${diffMonths === 1 ? '' : 's'} ago`;
  return `${diffYears} year${diffYears === 1 ? '' : 's'} ago`;
}
