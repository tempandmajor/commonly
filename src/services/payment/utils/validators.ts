/**
 * @file Validation utilities for payment service
 */

import { TransactionType } from '../core/types';
import { MIN_TRANSACTION_AMOUNT } from '../core/constants';

/**
 * Validate a credit amount
 * @param amount Amount to validate
 * @returns Validation result
 */
export function validateCreditAmount(amount: number): {
  isValid: boolean;
  error?: string;
} {
  if (isNaN(amount)) {
    return { isValid: false, error: 'Amount must be a number' };
  }

  if (amount <= 0) {
    return { isValid: false, error: 'Amount must be greater than 0' };
  }

  if (amount < MIN_TRANSACTION_AMOUNT.CREDIT / 100) {
    return {
      isValid: false,
      error: `Amount must be at least ${MIN_TRANSACTION_AMOUNT.CREDIT / 100}`,
    };
  }

  return { isValid: true };
}

/**
 * Validate a payment amount
 * @param amount Amount to validate
 * @returns Validation result
 */
export function validatePaymentAmount(amount: number): {
  isValid: boolean;
  error?: string;
} {
  if (isNaN(amount)) {
    return { isValid: false, error: 'Amount must be a number' };
  }

  if (amount <= 0) {
    return { isValid: false, error: 'Amount must be greater than 0' };
  }

  if (amount < MIN_TRANSACTION_AMOUNT.PAYMENT / 100) {
    return {
      isValid: false,
      error: `Amount must be at least ${MIN_TRANSACTION_AMOUNT.PAYMENT / 100}`,
    };
  }

  return { isValid: true };
}

/**
 * Validate a credit transaction
 * @param userId User ID
 * @param amount Amount to validate
 * @param type Transaction type
 * @returns Validation result
 */
export function validateCreditTransaction(
  userId: string,
  amount: number,
  type: TransactionType
): {
  isValid: boolean;
  error?: string;
} {
  // Validate user ID
  if (!userId) {
    return { isValid: false, error: 'User ID is required' };
  }

  // Validate amount based on transaction type
  if (type === TransactionType.CREDIT_ADDITION) {
    return validateCreditAmount(amount);
  } else if (type === TransactionType.CREDIT_DEDUCTION) {
    // For deductions, amount should be positive, but we'll deduct it
    return validateCreditAmount(amount);
  }

  // Validate general payment
  return validatePaymentAmount(amount);
}

/**
 * Validate a currency code
 * @param currencyCode Currency code to validate
 * @returns Whether the currency code is valid
 */
export function isValidCurrencyCode(currencyCode: string): boolean {
  // List of common currency codes
  const validCurrencies = [
    'USD',
    'EUR',
    'GBP',
    'JPY',
    'AUD',
    'CAD',
    'CHF',
    'CNY',
    'INR',
    'MXN',
    'BRL',
    'ZAR',
    'SGD',
    'NZD',
    'HKD',
  ];

  return validCurrencies.includes(currencyCode.toUpperCase());
}

/**
 * Validate a credit card number using Luhn algorithm
 * @param cardNumber Card number to validate
 * @returns Whether the card number is valid
 */

export function isValidCardNumber(cardNumber: string): boolean {
  // Remove spaces and dashes
  const sanitized = cardNumber.replace(/[\s-]/g, '');

  // Check if it contains only digits
  if (!/^\d+$/.test(sanitized)) {
    return false;
  }

  // Check length (most cards are 13-19 digits)
  if (sanitized.length < 13 || sanitized.length > 19) {
    return false;
  }

  // Luhn algorithm
  let sum = 0;
  let double = false;

  for (let i = sanitized.length - 1; i >= 0; i--) {
    let digit = parseInt(sanitized.charAt(i), 10);

    if (double) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    double = !double;
  }

  return sum % 10 === 0;
}

/**
 * Detect credit card type from number
 * @param cardNumber Card number to check
 * @returns Card type or null if unknown
 */
export function detectCardType(cardNumber: string): string | null {
  // Remove spaces and dashes
  const sanitized = cardNumber.replace(/[\s-]/g, '');

  // Check card type based on starting digits and length
  if (/^4\d{12}(\d{3})?$/.test(sanitized)) {
    return 'visa';
  } else if (/^5[1-5]\d{14}$/.test(sanitized)) {
    return 'mastercard';
  } else if (/^3[47]\d{13}$/.test(sanitized)) {
    return 'amex';
  } else if (/^6(?:011|5\d{2})\d{12}$/.test(sanitized)) {
    return 'discover';
  } else if (/^(?:2131|1800|35\d{3})\d{11}$/.test(sanitized)) {
    return 'jcb';
  } else if (/^3(?:0[0-5]|[68]\d)\d{11}$/.test(sanitized)) {
    return 'diners';
  } else {
    return null;
  }
}

/**
 * Validate a credit card expiry date
 * @param month Expiration month (1-12)
 * @param year Expiration year (2-digit or 4-digit)
 * @returns Whether the expiry date is valid and not expired
 */
export function isValidCardExpiry(month: number, year: number): boolean {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // JS months are 0-indexed

  // Convert 2-digit year to 4 digits if needed
  let fourDigitYear = year;
  if (year < 100) {
    fourDigitYear = 2000 + year;
  }

  // Check if month is valid
  if (month < 1 || month > 12) {
    return false;
  }

  // Check if card is expired
  if (fourDigitYear < currentYear) {
    return false;
  }

  if (fourDigitYear === currentYear && month < currentMonth) {
    return false;
  }

  return true;
}

/**
 * Validate a CVV code
 * @param cvv CVV code to validate
 * @param cardType Card type (optional, for length validation)
 * @returns Whether the CVV is valid
 */
export function isValidCvv(cvv: string, cardType?: string): boolean {
  // Remove spaces
  const sanitized = cvv.replace(/\s/g, '');

  // Check if it contains only digits
  if (!/^\d+$/.test(sanitized)) {
    return false;
  }

  // American Express requires a 4-digit CVV
  if (cardType === 'amex') {
    return sanitized.length === 4;
  }

  // All other card types use a 3-digit CVV
  return sanitized.length === 3;
}
