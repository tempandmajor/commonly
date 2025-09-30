import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';

interface ProtectedRouteProps {
  adminOnly?: boolean | undefined;
}

export const ProtectedRoute = ({ adminOnly = false }: ProtectedRouteProps) => {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className='flex items-center justify-center h-screen'>
        <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary'></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login if not authenticated
    return <Navigate to='/login' state={{ from: location }} replace />;
  }

  // For admin routes, check if user is admin
  if (adminOnly && !isAdmin) {
    // Redirect to dashboard if not an admin
    return <Navigate to='/dashboard' replace />;
  }

  // User is authenticated (and is admin if adminOnly is true)
  return <Outlet />;
};
