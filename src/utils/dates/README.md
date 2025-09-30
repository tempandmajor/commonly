
# Date Utility Module

A comprehensive date formatting and parsing utility that handles various date input types including strings, Date objects, and Firebase timestamps.

## Features

- Multiple date format options (full, short, ISO, relative)
- Robust error handling and fallbacks
- Firebase Timestamp support
- Type-safe with TypeScript

## Basic Usage

```typescript
import { formatDate } from '@/utils/dates';

// Basic date formatting
formatDate('2024-03-15'); // Output: "March 15, 2024"

// With options
formatDate('2024-03-15', { format: 'short' }); // Output: "03/15/2024"
formatDate('2024-03-15', { format: 'iso' }); // Output: "2024-03-15"
formatDate('2024-03-15', { format: 'relative' }); // Output: "2 months ago"

// With custom fallback
formatDate(null, { fallback: 'No date provided' }); // Output: "No date provided"
```

## Available Format Types

- `full` - "March 15, 2024"
- `short` - "03/15/2024"
- `iso` - "2024-03-15"
- `relative` - "2 months ago"

## Advanced Usage

### Working with Firebase Timestamps

```typescript
import { formatDate } from '@/utils/dates';

// Firebase Timestamp objects are automatically handled
formatDate(firestoreTimestamp);
```

### Using Individual Utilities

```typescript
import { parseDate, isValidDate, formatToLocalDate } from '@/utils/dates';

// Parse different date inputs
const date = parseDate('2024-03-15');

// Validate dates
if (isValidDate(date)) {
  // Work with valid date
}

// Custom formatting
const formattedDate = formatToLocalDate(date, 'short');
```

## Types

```typescript
type DateInput = string | Date | null | undefined | { toDate: () => Date };

type DateFormat = 'full' | 'short' | 'iso' | 'relative';

interface DateFormatOptions {
  format?: DateFormat;
  fallback?: string;
}
```

## Error Handling

The module includes built-in error handling:
- Invalid dates return the fallback value
- Parsing errors are gracefully handled
- Type checking for Firebase Timestamp objects

## Best Practices

1. Always provide a fallback for potentially invalid dates:
```typescript
formatDate(userInputDate, { fallback: 'Invalid date' });
```

2. Use type-safe format options:
```typescript
// ✅ Good - TypeScript will catch invalid formats
formatDate(date, { format: 'short' });

// ❌ Bad - TypeScript error
formatDate(date, { format: 'invalid-format' });
```

3. Consider using relative dates for better user experience:
```typescript
formatDate(commentDate, { format: 'relative' }); // "2 hours ago"
```
