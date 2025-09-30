import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

// Long date format including weekday and long month (e.g., Friday, September 6, 2024)
export function formatLongDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  }).format(date);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function classNames(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return `${str.substring(0, length)}...`;
}

export function calculateTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1)
    return `${Math.floor(interval)} year${Math.floor(interval) === 1 ? '' : 's'} ago`;

  interval = seconds / 2592000;
  if (interval > 1)
    return `${Math.floor(interval)} month${Math.floor(interval) === 1 ? '' : 's'} ago`;

  interval = seconds / 86400;
  if (interval > 1)
    return `${Math.floor(interval)} day${Math.floor(interval) === 1 ? '' : 's'} ago`;

  interval = seconds / 3600;
  if (interval > 1)
    return `${Math.floor(interval)} hour${Math.floor(interval) === 1 ? '' : 's'} ago`;

  interval = seconds / 60;
  if (interval > 1)
    return `${Math.floor(interval)} minute${Math.floor(interval) === 1 ? '' : 's'} ago`;

  return `${Math.floor(seconds)} second${Math.floor(seconds) === 1 ? '' : 's'} ago`;
}

export function generateInitials(name: string): string {
  const names = name.split(' ').filter(n => n.length > 0);
  if (names.length === 0) return '?';
  if (names.length === 1) return names[0].charAt(0).toUpperCase();
  return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase();
}

export function parseDate(dateString: string): Date {
  return new Date(dateString);
}

export function dateToString(date: Date | string): string {
  if (typeof date === 'string') {
    return date;
  }
  return date.toISOString();
}

// Safe conversion from string to Date
export function stringToDate(dateStr: string | Date): Date {
  if (dateStr instanceof Date) {
    return dateStr;
  }
  try {
    return new Date(dateStr);
  } catch (error) {
    return new Date(); // Return current date as fallback
  }
}
