import { RouteObject, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { LoadingSpinner } from '@/components/ui/loading';

// Lazy load all components for better performance
const Create = lazy(() => import('@/spa-pages/Create'));
const CreateEvent = lazy(() => import('@/spa-pages/CreateEvent'));
const EditEvent = lazy(() => import('@/spa-pages/EditEvent'));
const CreatePromotion = lazy(() => import('@/spa-pages/CreatePromotion'));
const ForCreators = lazy(() => import('@/spa-pages/ForCreators'));
const ForSponsors = lazy(() => import('@/spa-pages/ForSponsors'));
const Pro = lazy(() => import('@/spa-pages/Pro'));
const StripeConnectComplete = lazy(() => import('@/spa-pages/StripeConnectComplete'));
const StripeConnectRefresh = lazy(() => import('@/spa-pages/StripeConnectRefresh'));

// Loading wrapper component
const LazyWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense
    fallback={
      <div className='flex items-center justify-center min-h-screen'>
        <LoadingSpinner />
      </div>
    }
  >
    {children}
  </Suspense>
);

export const creatorRoutes: RouteObject[] = [
  {
    path: '/create',
    element: (
      <LazyWrapper>
        <Create />
      </LazyWrapper>
    ),
  },
  {
    path: '/create-event',
    element: (
      <LazyWrapper>
        <CreateEvent />
      </LazyWrapper>
    ),
  },
  // Backward compatibility redirects
  {
    path: '/create/event',
    element: <Navigate to='/create-event' replace />,
  },
  {
    path: '/create/promotion',
    element: <Navigate to='/create-promotion' replace />,
  },
  {
    path: '/events/:eventId/edit',
    element: (
      <LazyWrapper>
        <EditEvent />
      </LazyWrapper>
    ),
  },
  {
    path: '/create-promotion',
    element: (
      <LazyWrapper>
        <CreatePromotion />
      </LazyWrapper>
    ),
  },
  {
    path: '/for-creators',
    element: (
      <LazyWrapper>
        <ForCreators />
      </LazyWrapper>
    ),
  },
  {
    path: '/for-sponsors',
    element: (
      <LazyWrapper>
        <ForSponsors />
      </LazyWrapper>
    ),
  },
  {
    path: '/pro',
    element: (
      <LazyWrapper>
        <Pro />
      </LazyWrapper>
    ),
  },
  {
    path: '/connect/complete',
    element: (
      <LazyWrapper>
        <StripeConnectComplete />
      </LazyWrapper>
    ),
  },
  {
    path: '/connect/refresh',
    element: (
      <LazyWrapper>
        <StripeConnectRefresh />
      </LazyWrapper>
    ),
  },
];
