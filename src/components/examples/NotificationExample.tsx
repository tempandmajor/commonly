/**
 * Notification Service Example Component
 *
 * This component demonstrates the usage of the consolidated Notification Service,
 * showing different notification types and interactions.
 */

import React, { useState, useEffect } from 'react';
import { useNotification, NotificationVariant } from '@/services/notification';
import { formatRelativeTime } from '@/services/notification/utils/notificationUtils';
import { useAuth } from '@/services/auth';

const NotificationExample = () => {
  const { user } = useAuth();
  const {
    // Toast methods
    showToast,
    showSuccessToast,
    showInfoToast,
    showWarningToast,
    showErrorToast,

    // In-app notification data and methods
    inAppNotifications,
    unreadCount,
    isLoadingNotifications,
    markAsRead,
    deleteNotification,
    clearAllNotifications,
    createInAppNotification,

    // Status
    isMutating,
  } = useNotification({
    loadInAppNotifications: true,
    includeRead: true,
    refetchInterval: 10000, // 10 seconds for demo purposes
  });

  // Custom toast settings
  const [toastTitle, setToastTitle] = useState('Notification');
  const [toastMessage, setToastMessage] = useState('This is a notification message');
  const [toastVariant, setToastVariant] = useState<NotificationVariant>(
    NotificationVariant.DEFAULT
  );
  const [toastDuration, setToastDuration] = useState(5000);

  // Custom in-app notification settings
  const [inAppTitle, setInAppTitle] = useState('In-app Notification');
  const [inAppMessage, setInAppMessage] = useState('This is an in-app notification');

  // Handle toast form submission
  const handleToastSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    switch (toastVariant) {
      case NotificationVariant.SUCCESS:
        showSuccessToast(toastTitle, toastMessage, { duration: toastDuration });
        break;
      case NotificationVariant.INFO:
        showInfoToast(toastTitle, toastMessage, { duration: toastDuration });
        break;
      case NotificationVariant.WARNING:
        showWarningToast(toastTitle, toastMessage, { duration: toastDuration });
        break;
      case NotificationVariant.ERROR:
        showErrorToast(toastTitle, toastMessage, { duration: toastDuration });
        break;
      default:
        showToast(toastTitle, toastMessage, NotificationVariant.DEFAULT, {
          duration: toastDuration,
        });
    }
  };

  // Handle in-app notification creation
  const handleInAppSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showErrorToast('Error', 'You must be logged in to create in-app notifications');
      return;
    }

    createInAppNotification(inAppTitle, inAppMessage);
  };

  // Demo notifications on first load
  useEffect(() => {
    const timer = setTimeout(() => {
      showInfoToast('Welcome', 'This is the Notification Service example');
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Notification type labels for dropdown
  const notificationVariants = [
    { value: NotificationVariant.DEFAULT, label: 'Default' },
    { value: NotificationVariant.SUCCESS, label: 'Success' },
    { value: NotificationVariant.INFO, label: 'Info' },
    { value: NotificationVariant.WARNING, label: 'Warning' },
    { value: NotificationVariant.ERROR, label: 'Error' },
  ];

  return (
    <div className='container mx-auto p-4'>
      <h1 className='text-2xl font-bold mb-6'>Notification Service Example</h1>

      <div className='grid md:grid-cols-2 gap-8'>
        {/* Toast Notifications Section */}
        <div className='bg-white p-6 rounded-lg shadow-md'>
          <h2 className='text-xl font-semibold mb-4'>Toast Notifications</h2>

          <form onSubmit={handleToastSubmit} className='space-y-4'>
            <div>
              <label className='block text-sm font-medium mb-1'>Title</label>
              <input
                type='text'
                value={toastTitle}
                onChange={e => setToastTitle((e.target as HTMLInputElement).value)}
                className='w-full p-2 border rounded'
                required
              />
            </div>

            <div>
              <label className='block text-sm font-medium mb-1'>Message</label>
              <textarea
                value={toastMessage}
                onChange={e => setToastMessage((e.target as HTMLInputElement).value)}
                className='w-full p-2 border rounded'
                rows={2}
                required
              />
            </div>

            <div>
              <label className='block text-sm font-medium mb-1'>Variant</label>
              <select
                value={toastVariant}
                onChange={e => setToastVariant((e.target as HTMLInputElement).value as NotificationVariant)}
                className='w-full p-2 border rounded'
              >
                {notificationVariants.map(variant => (
                  <option key={variant.value} value={variant.value}>
                    {variant.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className='block text-sm font-medium mb-1'>
                Duration (ms): {toastDuration}
              </label>
              <input
                type='range'
                min='1000'
                max='10000'
                step='500'
                value={toastDuration}
                onChange={e => setToastDuration(Number((e.target as HTMLInputElement) as number.value) as number)}
                className='w-full'
              />
            </div>

            <button
              type='submit'
              className='w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600'
            >
              Show Toast
            </button>
          </form>

          <div className='mt-6'>
            <h3 className='text-md font-semibold mb-2'>Quick Examples</h3>
            <div className='grid grid-cols-2 gap-2'>
              <button
                onClick={() => showSuccessToast('Success', 'Operation completed successfully!')}
                className='bg-green-500 text-white py-1 px-2 rounded hover:bg-green-600 text-sm'
              >
                Success Toast
              </button>
              <button
                onClick={() => showInfoToast('Info', 'Here is some useful information.')}
                className='bg-blue-500 text-white py-1 px-2 rounded hover:bg-blue-600 text-sm'
              >
                Info Toast
              </button>
              <button
                onClick={() => showWarningToast('Warning', 'Be careful with this action!')}
                className='bg-yellow-500 text-white py-1 px-2 rounded hover:bg-yellow-600 text-sm'
              >
                Warning Toast
              </button>
              <button
                onClick={() => showErrorToast('Error', 'Something went wrong!')}
                className='bg-red-500 text-white py-1 px-2 rounded hover:bg-red-600 text-sm'
              >
                Error Toast
              </button>
            </div>
          </div>
        </div>

        {/* In-App Notifications Section */}
        <div className='bg-white p-6 rounded-lg shadow-md'>
          <div className='flex justify-between items-center mb-4'>
            <h2 className='text-xl font-semibold'>In-App Notifications</h2>
            <div className='bg-gray-100 px-2 py-1 rounded-full text-sm'>
              <span className='font-semibold'>{unreadCount}</span> unread
            </div>
          </div>

          {user ? (
            <form onSubmit={handleInAppSubmit} className='space-y-4 mb-4'>
              <div>
                <label className='block text-sm font-medium mb-1'>Title</label>
                <input
                  type='text'
                  value={inAppTitle}
                  onChange={e => setInAppTitle((e.target as HTMLInputElement).value)}
                  className='w-full p-2 border rounded'
                  required
                />
              </div>

              <div>
                <label className='block text-sm font-medium mb-1'>Message</label>
                <textarea
                  value={inAppMessage}
                  onChange={e => setInAppMessage((e.target as HTMLInputElement).value)}
                  className='w-full p-2 border rounded'
                  rows={2}
                  required
                />
              </div>

              <button
                type='submit'
                className='w-full bg-purple-500 text-white py-2 px-4 rounded hover:bg-purple-600'
                disabled={isMutating}
              >
                {isMutating ? 'Creating...' : 'Create In-App Notification'}
              </button>
            </form>
          ) : (
            <div className='bg-yellow-50 p-4 rounded mb-4'>
              <p className='text-yellow-700'>
                You must be logged in to create and view in-app notifications.
              </p>
            </div>
          )}

          <div className='mt-4'>
            <div className='flex justify-between items-center mb-2'>
              <h3 className='text-md font-semibold'>Your Notifications</h3>
              {inAppNotifications.length > 0 && (
                <button
                  onClick={clearAllNotifications}
                  className='text-xs text-red-500 hover:text-red-700'
                  disabled={isMutating}
                >
                  Clear All
                </button>
              )}
            </div>

            {isLoadingNotifications ? (
              <p className='text-gray-500 text-center py-4'>Loading notifications...</p>
            ) : inAppNotifications.length > 0 ? (
              <div className='space-y-2 max-h-96 overflow-y-auto'>
                {inAppNotifications.map(notification => (
                  <div
                    key={notification.id}
                    className={`p-3 border rounded-lg ${notification.read ? 'bg-gray-50' : 'bg-blue-50 border-blue-200'}`}
                  >
                    <div className='flex justify-between'>
                      <h4 className='font-medium'>{notification.title}</h4>
                      <button
                        onClick={() => deleteNotification(notification.id!)}
                        className='text-gray-400 hover:text-red-500 text-xs'
                        aria-label='Delete notification'
                      >
                        ✕
                      </button>
                    </div>
                    <p className='text-sm mt-1'>{notification.message}</p>
                    <div className='flex justify-between items-center mt-2'>
                      <span className='text-xs text-gray-500'>
                        {notification.timestamp && formatRelativeTime(notification.timestamp)}
                      </span>
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id!)}
                          className='text-xs text-blue-500 hover:text-blue-700'
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className='text-gray-500 text-center py-4'>No notifications to display</p>
            )}
          </div>
        </div>
      </div>

      <div className='mt-8 bg-white p-6 rounded-lg shadow-md'>
        <h2 className='text-xl font-semibold mb-4'>Implementation Notes</h2>

        <div className='prose max-w-none'>
          <h3>Using Toast Notifications</h3>
          <pre className='bg-gray-50 p-3 rounded text-sm'>
            {`// Import the hook
import { useNotification } from '@/services/notification';

// Use the hook in your component
const { showSuccessToast, showErrorToast } = useNotification();

// Show notifications
showSuccessToast('Success', 'Your data was saved successfully');
showErrorToast('Error', 'Something went wrong');`}
          </pre>

          <h3 className='mt-4'>Managing In-App Notifications</h3>
          <pre className='bg-gray-50 p-3 rounded text-sm'>
            {`// Get notification data
const {
  inAppNotifications,
  unreadCount,
  markAsRead,
  deleteNotification,
  createInAppNotification
} = useNotification();

// Create a new notification
createInAppNotification('New Message', 'You have a new message from admin');

// Display notification badge
<div className="badge">{unreadCount > 0 && <span>{unreadCount}</span>}</div>

// Show notifications list
{inAppNotifications.map(notification => (
  <div key={notification.id} className={notification.read ? 'read' : 'unread'}>
    <h4>{notification.title}</h4>
    <p>{notification.message}</p>
    <button onClick={() => markAsRead(notification.id)}>Mark as read</button>
  </div>
))}`}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default NotificationExample;
