/**
 * Standardized State Management Types
 * Provides consistent patterns for Zustand stores
 */

import { User } from '@/services/user/types';
import { AppError } from '@/lib/errors/ErrorHandler';

// Base store state interface
export interface BaseStoreState {
  loading: boolean;
  error: AppError | null;
  lastUpdated: Date | null;
}

// Async operation state
export interface AsyncState<T = unknown> extends BaseStoreState {
  data: T | null;
}

// Collection state (for lists/arrays)
export interface CollectionState<T = unknown> extends BaseStoreState {
  items: T[];
  total: number;
  currentPage: number;
  pageSize: number;
  hasMore: boolean;
}

// User store state
export interface UserStoreState extends AsyncState<User> {
  isAuthenticated: boolean;
  permissions: string[];
  preferences: UserPreferences;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: boolean;
  emailUpdates: boolean;
}

// UI store state
export interface UIStoreState {
  sidebarOpen: boolean;
  modalStack: ModalState[];
  notifications: NotificationState[];
  loading: Record<string, boolean>;
  theme: 'light' | 'dark' | 'system';
}

export interface ModalState {
  id: string;
  component: string;
  props: Record<string, unknown>;
  closable: boolean;
}

export interface NotificationState {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string | undefined;
  duration: number;
  timestamp: Date;
}

// Store actions interface
export interface BaseStoreActions<T = unknown> {
  setLoading: (loading: boolean) => void;
  setError: (error: AppError | null) => void;
  reset: () => void;
}

export interface AsyncStoreActions<T = unknown> extends BaseStoreActions<T> {
  setData: (data: T | null) => void;
  fetchData: () => Promise<void>;
  refetch: () => Promise<void>;
}

export interface CollectionStoreActions<T = unknown> extends BaseStoreActions<T> {
  setItems: (items: T[]) => void;
  addItem: (item: T) => void;
  updateItem: (id: string, updates: Partial<T>) => void;
  removeItem: (id: string) => void;
  fetchItems: (page?: number) => Promise<void>;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

// Complete store interfaces
export interface UserStore extends UserStoreState {
  actions: {
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    updateProfile: (updates: Partial<User>) => Promise<void>;
    setPreferences: (preferences: Partial<UserPreferences>) => void;
    refreshUser: () => Promise<void>;
  } & BaseStoreActions<User>;
}

export interface UIStore extends UIStoreState {
  actions: {
    toggleSidebar: () => void;
    setSidebarOpen: (open: boolean) => void;
    openModal: (component: string, props?: Record<string, unknown>) => string;
    closeModal: (id: string) => void;
    closeAllModals: () => void;
    showNotification: (notification: Omit<NotificationState, 'id' | 'timestamp'>) => string;
    hideNotification: (id: string) => void;
    clearNotifications: () => void;
    setTheme: (theme: 'light' | 'dark' | 'system') => void;
    setLoading: (key: string, loading: boolean) => void;
  };
}

// Store configuration options
export interface StoreConfig {
  name: string;
  version: number;
  storage?: boolean | undefined;
  devtools?: boolean | undefined;
}

// Store factory types
export type StoreFactory<T extends Record<string, unknown>> = () => T;

export type StoreSlice<T, E = T> = (
  set: (partial: Partial<T> | ((state: T) => Partial<T>)) => void,
  get: () => T,
  api: {
    setState: (partial: Partial<T> | ((state: T) => Partial<T>)) => void;
    getState: () => T;
    subscribe: (listener: (state: T, prevState: T) => void) => () => void;
    destroy: () => void;
  }
) => E;
