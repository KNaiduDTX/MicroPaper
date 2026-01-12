/**
 * Centralized data formatting utilities
 * Provides consistent formatting across the application
 */

import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns';

/**
 * Format currency amount
 */
export function formatCurrency(
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US',
  options?: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  }
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: options?.minimumFractionDigits ?? 0,
    maximumFractionDigits: options?.maximumFractionDigits ?? 0,
  }).format(amount);
}

/**
 * Format number with locale support
 */
export function formatNumber(
  value: number,
  locale: string = 'en-US',
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat(locale, options).format(value);
}

/**
 * Clean and parse date string (handles malformed dates)
 */
export function cleanDateString(dateString: string): string {
  if (!dateString) return dateString;
  
  let cleanDateString = dateString;
  if (dateString.includes('+00:00Z')) {
    cleanDateString = dateString.replace('+00:00Z', 'Z');
  } else if (dateString.includes('+00:00') && !dateString.endsWith('Z')) {
    cleanDateString = dateString.replace('+00:00', '') + 'Z';
  }
  
  return cleanDateString;
}

/**
 * Parse date string to Date object
 */
export function parseDate(dateString: string): Date | null {
  try {
    const cleaned = cleanDateString(dateString);
    const date = parseISO(cleaned);
    return isValid(date) ? date : null;
  } catch {
    return null;
  }
}

/**
 * Format date for display
 */
export function formatDate(
  dateString: string,
  formatString: string = 'MMM dd, yyyy'
): string {
  const date = parseDate(dateString);
  if (!date) return dateString;
  
  try {
    return format(date, formatString);
  } catch {
    return dateString;
  }
}

/**
 * Format date with time
 */
export function formatDateTime(
  dateString: string,
  dateFormat: string = 'MMM dd, yyyy',
  timeFormat: string = 'hh:mm a'
): { date: string; time: string; full: string } {
  const date = parseDate(dateString);
  if (!date) {
    return {
      date: dateString,
      time: '',
      full: dateString,
    };
  }
  
  try {
    return {
      date: format(date, dateFormat),
      time: format(date, timeFormat),
      full: format(date, `${dateFormat} ${timeFormat}`),
    };
  } catch {
    return {
      date: dateString,
      time: '',
      full: dateString,
    };
  }
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(dateString: string): string {
  const date = parseDate(dateString);
  if (!date) return dateString;
  
  try {
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return dateString;
  }
}

/**
 * Format time ago (short format)
 */
export function formatTimeAgo(dateString: string): string {
  const date = parseDate(dateString);
  if (!date) return dateString;
  
  try {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffWeeks < 4) return `${diffWeeks}w ago`;
    if (diffMonths < 12) return `${diffMonths}mo ago`;
    
    return formatDate(dateString);
  } catch {
    return dateString;
  }
}

/**
 * Format wallet address (truncate with ellipsis)
 */
export function formatWalletAddress(
  address: string,
  startLength: number = 6,
  endLength: number = 4
): string {
  if (!address || address.length <= startLength + endLength) {
    return address;
  }
  
  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
}

/**
 * Calculate days until/since a date
 */
export function getDaysUntil(dateString: string): number | null {
  const date = parseDate(dateString);
  if (!date) return null;
  
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const days = diff >= 0 
    ? Math.ceil(diff / (1000 * 60 * 60 * 24))
    : Math.floor(diff / (1000 * 60 * 60 * 24));
  
  return days;
}

/**
 * Format days until maturity
 */
export function formatDaysUntilMaturity(dateString: string): string {
  const days = getDaysUntil(dateString);
  if (days === null) return 'N/A';
  
  if (days > 0) return `${days} days`;
  if (days === 0) return 'Matures today';
  return `Expired ${Math.abs(days)} days ago`;
}

/**
 * Format percentage
 */
export function formatPercentage(
  value: number,
  decimals: number = 1
): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
