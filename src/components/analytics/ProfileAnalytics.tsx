import React, { useEffect } from 'react';
import { trackProfileView } from '@/services/analyticsService';

interface ProfileAnalyticsProps {
  userId: string;
  isVisible?: boolean | undefined;
  children: React.ReactNode;
}

/**
 * A component that wraps profile-related components and tracks analytics
 */
const ProfileAnalytics: React.FC<ProfileAnalyticsProps> = ({
  userId,
  isVisible = true,
  children,
}) => {
  useEffect(() => {
    // Only track views if the component is visible
    if (isVisible && userId) {
      // Track the profile view
      trackProfileView(userId);

      // Timing data for performance monitoring
      const startTime = performance.now();

      return () => {
        // Calculate how long the user spent viewing the profile
        const duration = performance.now() - startTime;
        // This would typically send data to your analytics system
        if (duration > 10000) {
          // Only log if spent more than 10 seconds
        }
      };
    }
    return undefined;
  }, [userId, isVisible]);

  return <>{children}</>;
};

export default ProfileAnalytics;
