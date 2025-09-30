/**
 * Date parsing utilities
 */

export const parseToJSDate = (date: unknown): Date | null => {
  if (!date) return null;

  try {
    // Handle Date object
    if (date instanceof Date) {
      return date;
    }

    // Handle timestamp object with seconds/nanoseconds (Supabase format)
    if (typeof date === 'object' && 'seconds' in date) {
      const milliseconds = date.seconds * 1000 + Math.floor((date.nanoseconds || 0) / 1000000);
      return new Date(milliseconds);
    }

    // Handle string or number
    if (typeof date === 'string' || typeof date === 'number') {
      const parsed = new Date(date);
      return isNaN(parsed.getTime()) ? null : parsed;
    }

    return null;
  } catch (error) {
    return null;
  }
};
