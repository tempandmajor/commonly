import { RouteObject } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { LoadingSpinner } from '@/components/ui/loading';

// Lazy load all components for better performance
const CatererDiscovery = lazy(() => import('@/vite-pages/CatererDiscovery'));
const CatererDetails = lazy(() => import('@/vite-pages/CatererDetails'));
const CatererListingWizard = lazy(() => import('@/vite-pages/CatererListingWizard'));
const CatererManagement = lazy(() => import('@/vite-pages/CatererManagement'));
const CatererVerificationSuccess = lazy(() => import('@/vite-pages/CatererVerificationSuccess'));
const CatererBookingManagement = lazy(() => import('@/spa-pages/CatererBookingManagement'));

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

export const catererRoutes: RouteObject[] = [
  {
    path: '/caterers',
    element: (
      <LazyWrapper>
        <CatererDiscovery />
      </LazyWrapper>
    ),
  },
  {
    path: '/caterers/:id',
    element: (
      <LazyWrapper>
        <CatererDetails />
      </LazyWrapper>
    ),
  },
  {
    path: '/caterers/list-your-business',
    element: (
      <LazyWrapper>
        <CatererListingWizard />
      </LazyWrapper>
    ),
  },
  {
    path: '/caterer/management',
    element: (
      <LazyWrapper>
        <CatererManagement />
      </LazyWrapper>
    ),
  },
  {
    path: '/caterer/verification-success',
    element: (
      <LazyWrapper>
        <CatererVerificationSuccess />
      </LazyWrapper>
    ),
  },
  {
    path: '/caterer/bookings',
    element: (
      <LazyWrapper>
        <CatererBookingManagement />
      </LazyWrapper>
    ),
  },
];
