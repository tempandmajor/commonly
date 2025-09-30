import { RouteObject } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { LoadingSpinner } from '@/components/ui/loading';

// Lazy load admin components
const AdminLayout = lazy(() => import('@/components/admin/AdminLayout'));
const AdminDashboard = lazy(() => import('@/spa-pages/admin/AdminDashboard'));
const AdminContent = lazy(() => import('@/spa-pages/admin/AdminContent'));
const AdminBusiness = lazy(() => import('@/spa-pages/admin/AdminBusiness'));
const AdminSystem = lazy(() => import('@/spa-pages/admin/AdminSystem'));

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

export const adminRoutes: RouteObject[] = [
  {
    path: '/admin',
    element: (
      <LazyWrapper>
        <AdminLayout />
      </LazyWrapper>
    ),
    children: [
      {
        index: true,
        element: (
          <LazyWrapper>
            <AdminDashboard />
          </LazyWrapper>
        ),
      },
      {
        path: 'content',
        element: (
          <LazyWrapper>
            <AdminContent />
          </LazyWrapper>
        ),
      },
      {
        path: 'business',
        element: (
          <LazyWrapper>
            <AdminBusiness />
          </LazyWrapper>
        ),
      },
      {
        path: 'system',
        element: (
          <LazyWrapper>
            <AdminSystem />
          </LazyWrapper>
        ),
      },
    ],
  },
];