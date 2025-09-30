/**
 * @file Formatting utilities for payment service
 */

/**
 * Format a number as currency
 * @param amount Amount to format
 * @param currency Currency code
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a number as a credit amount
 * @param amount Amount to format
 * @returns Formatted credit string
 */
export function formatCredits(amount: number): string {
  const formatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  return formatter.format(amount);
}

/**
 * Convert cents to dollars
 * @param cents Amount in cents
 * @returns Amount in dollars
 */
export function centsToAmount(cents: number): number {
  return cents / 100;
}

/**
 * Convert dollars to cents
 * @param amount Amount in dollars
 * @returns Amount in cents
 */
export function amountToCents(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * Format a transaction type for display
 * @param type Transaction type string
 * @returns Display-friendly transaction type
 */
export function formatTransactionType(type: string): string {
  // Replace underscores with spaces and capitalize each word
  return type.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
}

/**
 * Format a date for display
 * @param date Date to format
 * @returns Formatted date string
 */
export function formatDate(date: Date | string): string {
  if (typeof date === 'string') {
    date = new Date(date);
  }

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }) as string;
}

/**
 * Format a datetime for display
 * @param date Date to format
 * @returns Formatted datetime string
 */
export function formatDateTime(date: Date | string): string {
  if (typeof date === 'string') {
    date = new Date(date);
  }

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }) as string;
}

/**
 * Format a credit card number for display
 * @param cardNumber Full card number
 * @returns Masked card number
 */

export function formatCardNumber(cardNumber: string): string {
  if (!cardNumber || cardNumber.length < 4) {
    return '';
  }

  // Show only last 4 digits
  return `•••• ${cardNumber.slice(-4)}`;
}

/**
 * Format a credit card expiration date
 * @param month Expiration month (1-12)
 * @param year Expiration year (2-digit or 4-digit)
 * @returns Formatted expiration date (MM/YY)
 */
export function formatCardExpiry(month: number, year: number): string {
  const formattedMonth = month.toString().padStart(2, '0');
  const formattedYear = year.toString().length > 2 ? year.toString().slice(-2) : year.toString();

  return `${formattedMonth}/${formattedYear}`;
}
