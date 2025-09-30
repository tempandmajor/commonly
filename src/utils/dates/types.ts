/**
 * Date utility types
 */

export type DateFormat =
  | 'MMM dd, yyyy'
  | 'MM/dd/yyyy'
  | 'yyyy-MM-dd'
  | 'dd/MM/yyyy'
  | 'MMMM dd, yyyy'
  | 'EEE, MMM dd, yyyy'
  | 'yyyy-MM-dd HH:mm'
  | 'MMM dd, yyyy HH:mm'
  | 'h:mm a'
  | 'HH:mm'
  | 'PPP'
  | 'Pp';

export interface TimestampObject {
  seconds: number;
  nanoseconds?: number | undefined;
}

export type DateInput = Date | string | number | TimestampObject | null | undefined;
