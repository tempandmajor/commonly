/**
 * Date validation utilities
 */

export const isValidDate = (value: unknown): boolean => {
  if (!value) return false;

  // Check if it's a Date object
  if (value instanceof Date) {
    return !isNaN(value.getTime());
  }

  // Check if it's a timestamp object with seconds
  if (typeof value === 'object' && 'seconds' in value) {
    return typeof value.seconds === 'number';
  }

  // Check if it's a valid date string or number
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    return !isNaN(date.getTime());
  }

  return false;
};
