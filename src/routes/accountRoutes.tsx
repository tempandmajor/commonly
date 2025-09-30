import { RouteObject, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { LoadingSpinner } from '@/components/ui/loading';

// Lazy load account components
const AccountLayout = lazy(() => import('@/components/account/AccountLayout'));
const AccountDashboard = lazy(() => import('@/spa-pages/account/AccountDashboard'));
const AccountProfile = lazy(() => import('@/spa-pages/account/AccountProfile'));
const AccountSettings = lazy(() => import('@/spa-pages/account/AccountSettings'));
const AccountNotifications = lazy(() => import('@/spa-pages/account/AccountNotifications'));
const AccountMessages = lazy(() => import('@/spa-pages/account/AccountMessages'));
const AccountTickets = lazy(() => import('@/spa-pages/account/AccountTickets'));

// Legacy profile for public viewing
const Profile = lazy(() => import('@/spa-pages/Profile'));

// Loading wrapper component
const LazyWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense
    fallback={
      <div className='flex items-center justify-center min-h-screen'>
        <LoadingSpinner size='lg' />
      </div>
    }
  >
    {children}
  </Suspense>
);

export const accountRoutes: RouteObject[] = [
  // Unified Account Routes
  {
    path: '/account',
    element: (
      <LazyWrapper>
        <AccountLayout />
      </LazyWrapper>
    ),
    children: [
      {
        index: true,
        element: (
          <LazyWrapper>
            <AccountDashboard />
          </LazyWrapper>
        ),
      },
      {
        path: 'profile',
        element: (
          <LazyWrapper>
            <AccountProfile />
          </LazyWrapper>
        ),
      },
      {
        path: 'settings',
        element: (
          <LazyWrapper>
            <AccountSettings />
          </LazyWrapper>
        ),
      },
      {
        path: 'notifications',
        element: (
          <LazyWrapper>
            <AccountNotifications />
          </LazyWrapper>
        ),
      },
      {
        path: 'messages',
        element: (
          <LazyWrapper>
            <AccountMessages />
          </LazyWrapper>
        ),
      },
      {
        path: 'tickets',
        element: (
          <LazyWrapper>
            <AccountTickets />
          </LazyWrapper>
        ),
      },
      // Security and Privacy will be handled as tabs in settings
      {
        path: 'security',
        element: (
          <LazyWrapper>
            <AccountSettings />
          </LazyWrapper>
        ),
      },
      {
        path: 'privacy',
        element: (
          <LazyWrapper>
            <AccountSettings />
          </LazyWrapper>
        ),
      },
    ],
  },

  // Legacy redirects - redirect old routes to new account system
  {
    path: '/profile',
    element: (
      <LazyWrapper>
        <Profile />
      </LazyWrapper>
    ),
  },
  {
    path: '/profile/:username',
    element: (
      <LazyWrapper>
        <Profile />
      </LazyWrapper>
    ),
  },

  // Redirect legacy routes to new account system
  {
    path: '/settings',
    element: <Navigate to="/account/settings" replace />,
  },
  {
    path: '/notifications',
    element: <Navigate to="/account/notifications" replace />,
  },
  {
    path: '/messages',
    element: <Navigate to="/account/messages" replace />,
  },
  {
    path: '/tickets',
    element: <Navigate to="/account/tickets" replace />,
  },
];