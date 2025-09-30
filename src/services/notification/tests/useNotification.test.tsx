/**
 * Notification Service - React Hooks Tests
 *
 * Unit tests for the notification React hooks.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useNotification,
  useBadgeNotification,
  NotificationProvider,
} from '../hooks/useNotification';
import { notificationAPI } from '../api/notificationAPI';
import { ReactNode } from 'react';

// Mock dependencies
vi.mock('@/services/auth', () => ({
  useAuth: () => ({
    user: { id: 'test-user', email: 'test@example.com' },
  }),
}));

vi.mock('../api/notificationAPI', () => ({
  notificationAPI: {
    initialize: vi.fn().mockResolvedValue(undefined),
    showToast: vi.fn().mockResolvedValue({ status: 'delivered' }),
    showSuccessToast: vi.fn().mockResolvedValue({ status: 'delivered' }),
    showInfoToast: vi.fn().mockResolvedValue({ status: 'delivered' }),
    showWarningToast: vi.fn().mockResolvedValue({ status: 'delivered' }),
    showErrorToast: vi.fn().mockResolvedValue({ status: 'delivered' }),
    createInAppNotification: vi.fn().mockResolvedValue({ status: 'sent' }),
    getInAppNotifications: vi.fn().mockReturnValue([
      { id: 'notif1', title: 'Test', message: 'Test message', read: false },
      { id: 'notif2', title: 'Test 2', message: 'Test message 2', read: true },
    ]),
    markAsRead: vi.fn().mockReturnValue({ id: 'notif1', read: true }),
    deleteNotification: vi.fn().mockReturnValue(true),
    clearUserNotifications: vi.fn().mockReturnValue(2),
  },
}));

// Mock React Query
vi.mock('@tanstack/react-query', () => ({
  useQuery: ({ queryFn }) => {
    return {
      data: queryFn ? queryFn() : [],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    };
  },
  useMutation: ({ mutationFn, onSuccess }) => {
    const mutate = arg => {
      const result = mutationFn(arg);
      onSuccess(result);
      return result;
    };
    return {
      mutate,
      isPending: false,
    };
  },
  useQueryClient: () => ({
    invalidateQueries: vi.fn(),
  }),
}));

// Mock localStorage for badge notifications
beforeEach(() => {
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    },
    writable: true,
  });
});

// Create a wrapper for testing hooks with providers
const wrapper = ({ children }: { children: ReactNode }) => (
  <NotificationProvider options={{ loadInAppNotifications: true }}>{children}</NotificationProvider>
);

describe('useNotification Hook', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should provide toast notification methods', () => {
    const { result } = renderHook(() => useNotification());

    expect(result.current.showToast).toBeDefined();
    expect(result.current.showSuccessToast).toBeDefined();
    expect(result.current.showInfoToast).toBeDefined();
    expect(result.current.showWarningToast).toBeDefined();
    expect(result.current.showErrorToast).toBeDefined();
  });

  it('should call notification API when showing toast', async () => {
    const { result } = renderHook(() => useNotification());

    await act(async () => {
      await result.current.showSuccessToast('Success', 'It worked');
    });

    expect(notificationAPI.showSuccessToast).toHaveBeenCalledWith(
      'Success',
      'It worked',
      expect.any(Object)
    );
  });

  it('should fetch and provide in-app notifications', () => {
    const { result } = renderHook(() => useNotification());

    expect(notificationAPI.getInAppNotifications).toHaveBeenCalled();
    expect(result.current.inAppNotifications).toHaveLength(2);
    expect(result.current.unreadCount).toBe(1); // One notification is unread
  });

  it('should mark notifications as read', async () => {
    const { result } = renderHook(() => useNotification());

    await act(async () => {
      result.current.markAsRead('notif1');
    });

    expect(notificationAPI.markAsRead).toHaveBeenCalledWith('notif1');
  });

  it('should delete notifications', async () => {
    const { result } = renderHook(() => useNotification());

    await act(async () => {
      result.current.deleteNotification('notif1');
    });

    expect(notificationAPI.deleteNotification).toHaveBeenCalledWith('notif1');
  });

  it('should clear all notifications', async () => {
    const { result } = renderHook(() => useNotification());

    await act(async () => {
      result.current.clearAllNotifications();
    });

    expect(notificationAPI.clearUserNotifications).toHaveBeenCalledWith('test-user');
  });

  it('should create in-app notifications', async () => {
    const { result } = renderHook(() => useNotification());

    await act(async () => {
      await result.current.createInAppNotification('Test Title', 'Test message');
    });

    expect(notificationAPI.createInAppNotification).toHaveBeenCalledWith(
      'test-user',
      'Test Title',
      'Test message',
      expect.any(Object)
    );
  });
});

describe('useBadgeNotification Hook', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    window.localStorage.getItem.mockReturnValue(null);
  });

  it('should start with undismissed state when no localStorage entry exists', () => {
    const { result } = renderHook(() => useBadgeNotification('feature-tour'));

    expect(result.current.isDismissed).toBe(false);
    expect(window.localStorage.getItem).toHaveBeenCalledWith('badge_dismissed_feature-tour');
  });

  it('should restore dismissed state from localStorage', () => {
    window.localStorage.getItem.mockReturnValue('true');

    const { result } = renderHook(() => useBadgeNotification('feature-tour'));

    expect(result.current.isDismissed).toBe(true);
  });

  it('should dismiss badge and save to localStorage', () => {
    const { result } = renderHook(() => useBadgeNotification('feature-tour'));

    act(() => {
      result.current.dismissBadge();
    });

    expect(result.current.isDismissed).toBe(true);
    expect(window.localStorage.setItem).toHaveBeenCalledWith(
      'badge_dismissed_feature-tour',
      'true'
    );
  });

  it('should reset badge and remove from localStorage', () => {
    window.localStorage.getItem.mockReturnValue('true');

    const { result } = renderHook(() => useBadgeNotification('feature-tour'));
    expect(result.current.isDismissed).toBe(true);

    act(() => {
      result.current.resetBadge();
    });

    expect(result.current.isDismissed).toBe(false);
    expect(window.localStorage.removeItem).toHaveBeenCalledWith('badge_dismissed_feature-tour');
  });
});

describe('NotificationProvider', () => {
  it('should provide notification context to children', async () => {
    const { result } = renderHook(() => useNotification(), { wrapper });

    expect(result.current.showSuccessToast).toBeDefined();
    expect(result.current.inAppNotifications).toBeDefined();
  });
});
