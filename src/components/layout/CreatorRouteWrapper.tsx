import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { useAnalytics } from '@/hooks/useAnalytics';

const CreatorRouteWrapper = () => {
  const { user, isLoading } = useAuth();

  // Fix: Use the correct 2-parameter signature for useAnalytics
  const { trackEvent } = useAnalytics('/creator-route', 'Creator Route Access');

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to='/login' replace />;
  }

  // Track creator route access
  trackEvent('creator_route_access', { userId: user.id });

  return <Outlet />;
};

export default CreatorRouteWrapper;
