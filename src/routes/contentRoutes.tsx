import { RouteObject, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { LoadingSpinner } from '@/components/ui/loading';

// Lazy load the consolidated page
const ContentAndLegal = lazy(() => import('@/spa-pages/ContentAndLegal'));

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

export const contentRoutes: RouteObject[] = [
  // New consolidated route
  {
    path: '/content',
    element: (
      <LazyWrapper>
        <ContentAndLegal />
      </LazyWrapper>
    ),
  },
  // Redirect old routes to consolidated page with appropriate tab
  {
    path: '/blog',
    element: <Navigate to='/content?tab=blog' replace />,
  },
  {
    path: '/guidelines',
    element: <Navigate to='/content?tab=guidelines' replace />,
  },
  {
    path: '/careers',
    element: <Navigate to='/content?tab=careers' replace />,
  },
  {
    path: '/privacy-policy',
    element: <Navigate to='/content?tab=privacy' replace />,
  },
  {
    path: '/privacy',
    element: <Navigate to='/content?tab=privacy' replace />,
  },
  {
    path: '/terms-of-service',
    element: <Navigate to='/content?tab=terms' replace />,
  },
  {
    path: '/terms',
    element: <Navigate to='/content?tab=terms' replace />,
  },
  {
    path: '/cookie-policy',
    element: <Navigate to='/content?tab=cookies' replace />,
  },
];
