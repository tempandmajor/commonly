/**
 * Currency formatting utilities
 * Consolidated module for all currency-related functions
 */

/**
 * Format a number as currency
 * @param amount The amount to format (must be a valid number)
 * @param currencyCode The currency code (default: USD)
 * @returns Formatted currency string (e.g., "$1,234.56")
 *
 * @example
 * // Returns "$1,234.56"
 * formatCurrency(1234.56);
 *
 * @example
 * // Returns "€1,234.56"
 * formatCurrency(1234.56, "EUR");
 */
export const formatCurrency = (amount: number, currencyCode: string = 'USD'): string => {
  try {
    // Handle NaN, undefined or null values
    if (amount === null || amount === undefined || isNaN(amount)) {
      return `$0.00`;
    }

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode.toUpperCase(),
    }).format(amount);
  } catch (error) {
    // Fallback formatting for production reliability
    return `$${amount.toFixed(2)}`;
  }
};

/**
 * Parse a currency string into a number
 * @param currencyString The currency string to parse
 * @returns Parsed number
 */
export const parseCurrency = (currencyString: string): number => {
  try {
    // Remove currency symbols and other non-numeric characters except decimal point
    const numericString = currencyString.replace(/[^\d.]/g, '');
    return parseFloat(numericString) || 0;
  } catch (error) {
    return 0;
  }
};

/**
 * Format a number as a percentage
 * @param value The value to format as percentage
 * @param decimals The number of decimal places (default: 2)
 * @returns Formatted percentage string
 */
export const formatPercentage = (value: number, decimals: number = 2): string => {
  try {
    return `${value * 100}.toFixed(decimals)}%`;
  } catch (error) {
    return `${value}%`;
  }
};

/**
 * Convert amount from one currency to another
 * @param amount The amount to convert
 * @param fromCurrency Source currency code
 * @param toCurrency Target currency code
 * @param exchangeRate Custom exchange rate (optional)
 * @returns Converted amount
 */
export const convertCurrency = (
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  exchangeRate?: number
): number => {
  // If currencies are the same, no conversion needed
  if (fromCurrency === toCurrency) return amount;

  // Use provided exchange rate if available
  if (exchangeRate) {
    return amount * exchangeRate;
  }

  // Default fallback (in production, you'd connect to an exchange rate API)
  return amount;
};

/**
 * Format a number with the specified decimal places
 * @param value The number to format
 * @param decimalPlaces The number of decimal places (default: 2)
 * @returns Formatted number string
 */
export const formatDecimal = (value: number, decimalPlaces: number = 2): string => {
  return value.toFixed(decimalPlaces);
};
