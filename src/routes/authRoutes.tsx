import { RouteObject, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { LoadingSpinner } from '@/components/ui/loading';

const Login = lazy(() => import('@/spa-pages/Login'));
const ResetPassword = lazy(() => import('@/spa-pages/ResetPassword'));
const EmailConfirm = lazy(() => import('@/spa-pages/EmailConfirm'));

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

export const authRoutes: RouteObject[] = [
  {
    path: '/auth',
    element: (
      <LazyWrapper>
        <Login />
      </LazyWrapper>
    ),
  },
  {
    path: '/login',
    element: (
      <LazyWrapper>
        <Login />
      </LazyWrapper>
    ),
  },
  {
    path: '/register',
    element: <Navigate to='/auth?register=true' replace />,
  },
  {
    path: '/reset-password',
    element: (
      <LazyWrapper>
        <ResetPassword />
      </LazyWrapper>
    ),
  },
  {
    path: '/forgot-password',
    element: (
      <LazyWrapper>
        <ResetPassword />
      </LazyWrapper>
    ),
  },
  {
    path: '/auth/reset-password',
    element: (
      <LazyWrapper>
        <ResetPassword />
      </LazyWrapper>
    ),
  },
  {
    path: '/auth/confirm',
    element: (
      <LazyWrapper>
        <EmailConfirm />
      </LazyWrapper>
    ),
  },
];
