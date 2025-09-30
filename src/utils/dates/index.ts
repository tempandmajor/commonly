export const isLegacyTimestamp = (
  value: unknown
): value is { seconds: number; nanoseconds?: number } => {
  return (
    value !== null &&
    value !== undefined &&
    typeof value === 'object' &&
    'seconds' in value &&
    typeof (value as any).seconds === 'number'
  );
};

export const formatDate = (date: Date | string | null | undefined): string => {
  if (!date) return 'N/A';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString();
};

export const formatTimestamp = (timestamp: unknown): string => {
  if (!timestamp) return '';
  try {
    const date = new Date(timestamp as string | number | Date);
    return date.toISOString();
  } catch (error) {
    return '';
  }
};

export const formatRelativeTime = (date: Date | string | null | undefined): string => {
  if (!date) return 'N/A';

  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diff = now.getTime() - d.getTime();

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} days ago`;
    if (hours > 0) return `${hours} hours ago`;
    if (minutes > 0) return `${minutes} minutes ago`;
    return 'Just now';
  } catch (error) {
    return 'N/A';
  }
};

export const toJSDate = (value: unknown): Date => {
  if (value instanceof Date) {
    return value;
  }
  if (typeof value === 'string' || typeof value === 'number') {
    return new Date(value);
  }
  if (isLegacyTimestamp(value)) {
    return new Date(value.seconds * 1000);
  }
  return new Date();
};
