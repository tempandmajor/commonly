import { RouteObject, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { LoadingSpinner } from '@/components/ui/loading';

// Lazy load all components for better performance - Updated to use new enhanced pages
const VenueDiscovery = lazy(() => import('@/pages/VenueDiscovery'));
const VenueDetails = lazy(() => import('@/pages/VenueDetails'));
const VenueListingWizard = lazy(() => import('@/pages/VenueListingWizard'));
const VenueManagement = lazy(() => import('@/pages/VenueManagement'));
const VenueVerificationSuccess = lazy(() => import('@/pages/VenueVerificationSuccess'));

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

export const venueRoutes: RouteObject[] = [
  // New enhanced venue discovery page
  {
    path: '/venues',
    element: (
      <LazyWrapper>
        <VenueDiscovery />
      </LazyWrapper>
    ),
  },
  // Legacy redirect for backward compatibility
  {
    path: '/venue-listings',
    element: <Navigate to='/venues' replace />,
  },
  // Enhanced venue details page
  {
    path: '/venues/:venueId',
    element: (
      <LazyWrapper>
        <VenueDetails />
      </LazyWrapper>
    ),
  },
  // New venue listing wizard
  {
    path: '/venue/list-your-venue',
    element: (
      <LazyWrapper>
        <VenueListingWizard />
      </LazyWrapper>
    ),
  },
  // Venue management dashboard
  {
    path: '/venue/management',
    element: (
      <LazyWrapper>
        <VenueManagement />
      </LazyWrapper>
    ),
  },
  // Enhanced verification success page
  {
    path: '/venue/verification-complete',
    element: (
      <LazyWrapper>
        <VenueVerificationSuccess />
      </LazyWrapper>
    ),
  },
  // Legacy booking management redirect (VenueManagement has a bookings tab)
  {
    path: '/venue/bookings',
    element: <Navigate to='/venue/management' replace />,
  },
  // Legacy public venues redirect (kept temporarily for compatibility)
  {
    path: '/public-venues',
    element: <Navigate to='/venues' replace />,
  },
];
