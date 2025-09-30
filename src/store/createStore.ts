/**
 * Standardized Store Factory
 * Provides consistent patterns for creating Zustand stores
 */

import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { StoreConfig, StoreSlice } from './types';

/**
 * Create a standardized Zustand store with middleware
 */
export function createStore<T extends Record<string, unknown>>(
  storeSlice: StoreSlice<T>,
  config: StoreConfig
) {
  let store = create<T>()(
    immer(
      devtools(storeSlice, {
        name: config.name,
        enabled: config.devtools !== false && process.env.NODE_ENV as string === 'development',
      })
    )
  );

  // Add persistence if requested
  if (config.storage) {
    store = create<T>()(
      persist(
        immer(
          devtools(storeSlice, {
            name: config.name,
            enabled: config.devtools !== false && process.env.NODE_ENV as string === 'development',
          })
        ),
        {
          name: `${config.name}-storage`,
          storage: createJSONStorage(() => localStorage),
          version: config.version,
        }
      )
    );
  }

  return store;
}

/**
 * Create async store with loading/error states
 */
export function createAsyncStore<T extends Record<string, unknown>>(
  storeSlice: StoreSlice<T>,
  config: StoreConfig
) {
  return createStore<T>(
    (set, get, api) => ({
          ...storeSlice(set, get, api),
      loading: false,
      error: null,
      lastUpdated: null,

      // Standard async actions
      setLoading: (loading: boolean) =>
        set(state => {
          state.loading = loading;
        }),

      setError: (error: any) =>
        set(state => {
          state.error = error;
          state.loading = false;
        }),

      setSuccess: (data?: any) =>
        set(state => {
          if (data !== undefined) state.data = data;
          state.error = null;
          state.loading = false;
          state.lastUpdated = new Date();
        }),

      reset: () =>
        set(state => {
          state.loading = false;
          state.error = null;
          state.lastUpdated = null;
          if ('data' in state) state.data = null;
          if ('items' in state) state.items = [];
        }),
    }),
    config
  );
}

/**
 * Create collection store for managing lists
 */
export function createCollectionStore<T extends { id: string }>(
  storeSlice: StoreSlice<any>,
  config: StoreConfig
) {
  return createAsyncStore(
    (set, get, api) => ({
          ...storeSlice(set, get, api),
      items: [] as T[],
      total: 0,
      currentPage: 1,
      pageSize: 20,
      hasMore: false,

      // Collection actions
      setItems: (items: T[]) =>
        set(state => {
          state.items = items;
        }),

      addItem: (item: T) =>
        set(state => {
          state.items.push(item);
        }),

      updateItem: (id: string, updates: Partial<T>) =>
        set(state => {
          const index = state.items.findIndex((item: T) => item.id === id);
          if (index !== -1) {
            state.items[index] = { ...state.items[index], ...updates };
          }
        }),

      removeItem: (id: string) =>
        set(state => {
          state.items = state.items.filter((item: T) => item.id !== id);
        }),

      setPagination: (page: number, total: number, hasMore: boolean) =>
        set(state => {
          state.currentPage = page;
          state.total = total;
          state.hasMore = hasMore;
        }),
    }),
    config
  );
}

/**
 * Hook factory for type-safe store usage
 */
export function createStoreHook<T>(store: any) {
  return {
    useStore: store,
    useActions: () => store((state: T) => (state as any).actions),
    useLoading: () => store((state: T) => (state as any).loading),
    useError: () => store((state: T) => (state as any).error),
    useData: () => store((state: T) => (state as any).data),
    useItems: () => store((state: T) => (state as any).items),
  };
}
