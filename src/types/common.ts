/**
 * Common Type Definitions
 * Replaces 'any' types with proper interfaces across the application
 */

// Generic API Response
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string | null;
  success: boolean;
  message?: string;
  statusCode?: number;
}

// Supabase Response Types
export interface SupabaseResponse<T = unknown> {
  data: T | null;
  error: SupabaseError | null;
  status: number;
  statusText: string;
}

export interface SupabaseError {
  message: string;
  details?: string | undefined;
  hint?: string | undefined;
  code?: string | undefined;
}

// Form Data Types
export interface FormField {
  name: string;
  value: string | number | boolean | null;
  type?: string | undefined;
  required?: boolean | undefined;
  validation?: ValidationRule[] | undefined;
}

export interface ValidationRule {
  type: 'required' | 'email' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  value?: string | undefined| number;
  message: string;
  validator?: (value: unknown) => boolean | undefined;
}

export interface FormState {
  fields: Record<string, FormField>;
  errors: Record<string, string>;
  isValid: boolean;
  isSubmitting: boolean;
  isDirty: boolean;
}

// Event Handler Types
export interface EventHandler<T = HTMLElement> {
  (event: React.ChangeEvent<T>): void;
}

export interface ClickHandler<T = HTMLElement> {
  (event: React.MouseEvent<T>): void;
}

export interface SubmitHandler<T = HTMLFormElement> {
  (event: React.FormEvent<T>): void;
}

// Component Props Types
export interface BaseComponentProps {
  className?: string | undefined;
  children?: React.ReactNode | undefined;
  id?: string | undefined;
  'data-testid'?: string;
}

export interface LoadingProps extends BaseComponentProps {
  isLoading: boolean;
  loadingText?: string;
  size?: 'sm' | 'md' | 'lg';
}

export interface ErrorProps extends BaseComponentProps {
  error: string | Error | null;
  onRetry?: () => void;
  showRetry?: boolean;
}

// Data Table Types
export interface TableColumn<T = unknown> {
  key: string;
  title: string;
  dataIndex: keyof T;
  render?: (value: unknown, record: T, index: number) => React.ReactNode;
  sorter?: boolean | ((a: T, b: T) => number);
  width?: string | number;
  align?: 'left' | 'center' | 'right';
  fixed?: 'left' | 'right';
}

export interface TableProps<T = unknown> {
  columns: TableColumn<T>[];
  dataSource: T[];
  loading?: boolean;
  pagination?: PaginationConfig;
  rowKey?: string | ((record: T) => string);
  onRow?: (record: T, index?: number) => TableRowEventHandlers;
  scroll?: { x?: number; y?: number };
}

export interface PaginationConfig {
  current: number;
  pageSize: number;
  total: number;
  showSizeChanger?: boolean | undefined;
  showQuickJumper?: boolean | undefined;
  onChange?: (page: number, pageSize: number) => void | undefined;
}

export interface TableRowEventHandlers {
  onClick?: ClickHandler | undefined;
  onDoubleClick?: ClickHandler | undefined;
  onMouseEnter?: ClickHandler | undefined;
  onMouseLeave?: ClickHandler | undefined;
}

// Modal/Dialog Types
export interface ModalProps extends BaseComponentProps {
  visible: boolean;
  onCancel: () => void;
  onOk?: () => void;
  title?: string;
  width?: string | number;
  footer?: React.ReactNode;
  maskClosable?: boolean;
  destroyOnClose?: boolean;
}

// File Upload Types
export interface FileUploadProps extends BaseComponentProps {
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  onUpload: (files: File[]) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string | undefined;
  progress?: number | undefined;
  status: 'uploading' | 'success' | 'error';
  error?: string | undefined;
}

// Search/Filter Types
export interface SearchProps extends BaseComponentProps {
  placeholder?: string;
  onSearch: (value: string) => void;
  loading?: boolean;
  allowClear?: boolean;
  enterButton?: boolean | string;
}

export interface FilterOption {
  label: string;
  value: string | number;
  disabled?: boolean | undefined;
  children?: FilterOption[] | undefined;
}

export interface FilterProps extends BaseComponentProps {
  options: FilterOption[];
  value?: string | number | (string | number)[];
  onChange: (value: string | number | (string | number)[]) => void;
  placeholder?: string;
  multiple?: boolean;
  allowClear?: boolean;
}

// Notification Types
export interface NotificationProps {
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  description?: string | undefined;
  duration?: number | undefined;
  onClose?: () => void | undefined;
  action?: {
    label: string | undefined;
    onClick: () => void;
  };
}

// Chart/Analytics Types
export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string | undefined;
  metadata?: Record<string, unknown> | undefined;
}

export interface ChartProps extends BaseComponentProps {
  data: ChartDataPoint[];
  type: 'line' | 'bar' | 'pie' | 'area';
  height?: number;
  width?: number;
  loading?: boolean;
  config?: Record<string, unknown>;
}

// Media Types
export interface MediaItem {
  id: string;
  type: 'image' | 'video' | 'audio';
  url: string;
  thumbnail?: string | undefined;
  title?: string | undefined;
  description?: string | undefined;
  size?: number | undefined;
  duration?: number | undefined; // for video/audio
  dimensions?: { width: number | undefined; height: number }; // for images/videos
}

// Geolocation Types
export interface Coordinates {
  latitude: number;
  longitude: number;
  altitude?: number | undefined;
  accuracy?: number | undefined;
}

export interface Location extends Coordinates {
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  timezone?: string;
}

// Generic Utility Types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
  }[Keys];

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type NonEmptyArray<T> = [T, ...T[]];

export type KeyValuePair<T = string> = {
  key: string;
  value: T;
};

// Environment and Configuration Types
export interface EnvironmentConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  API_URL: string;
  DATABASE_URL?: string | undefined;
  SUPABASE_URL?: string | undefined;
  SUPABASE_ANON_KEY?: string | undefined;
  STRIPE_PUBLISHABLE_KEY?: string | undefined;
  [key: string]: string | undefined;
}
