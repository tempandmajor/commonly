/**
 * Main date formatting utilities
 */
import { format, formatDistanceToNow } from 'date-fns';
import { parseToJSDate } from './parsers';
import { isValidDate } from './validators';

/**
 * Format timestamps from various sources including Supabase
 */
export const formatTimestamp = (timestamp: unknown): string => {
  if (!timestamp) return '';

  const dateObj = parseToJSDate(timestamp);
  return dateObj ? format(dateObj, 'MMM dd, yyyy') : '';
};

export const formatTimestampObject = formatTimestamp;

/**
 * Format a date with a specific pattern
 */
export const formatDate = (date: unknown, pattern: string = 'MMM dd, yyyy'): string => {
  if (!date) return '';

  let dateObj: Date | null = null;

  if (isValidDate(date)) {
    dateObj = parseToJSDate(date)!;
  } else if (typeof date === 'string' || typeof date === 'number') {
    dateObj = new Date(date);
  }

  if (!dateObj || isNaN(dateObj.getTime())) {
    return '';
  }

  try {
    return format(dateObj, pattern);
  } catch (error) {
    return '';
  }
};

/**
 * Format relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (date: unknown): string => {
  if (!date) return '';

  let dateObj: Date | null = null;

  if (isValidDate(date)) {
    dateObj = parseToJSDate(date)!;
  } else if (typeof date === 'string' || typeof date === 'number') {
    dateObj = new Date(date);
  }

  if (!dateObj || isNaN(dateObj.getTime())) {
    return '';
  }

  try {
    return formatDistanceToNow(dateObj, { addSuffix: true });
  } catch (error) {
    return '';
  }
};

/**
 * Convert various date formats to JavaScript Date
 */
export const toJSDate = (date: unknown): Date | null => {
  return parseToJSDate(date);
};
