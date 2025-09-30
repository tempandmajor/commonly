import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { getCacheHealthStatus, clearNonEssentialCache, isQuotaError } from '@/utils/cache';

const StorageQuotaHandler: React.FC = () => {
  const [quotaWarningShown, setQuotaWarningShown] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkStorageHealth = async () => {
      try {
        const health = await getCacheHealthStatus();

        if (!mounted) return;

        // If storage is getting full (>85%), warn user and clear non-essential cache
        if (health.usagePercent > 85 && !quotaWarningShown) {
          // Clear non-essential cache automatically
          await clearNonEssentialCache(true);

          // Show warning toast
          toast.warning('Storage space low. Cleared old cache to prevent issues.');
          setQuotaWarningShown(true);

          // Reset warning after 1 hour
          setTimeout(
            () => {
              if (mounted) setQuotaWarningShown(false);
            },
            60 * 60 * 1000
          );
        }

        // If storage is critically full (>95%), force clear all non-essential data
        if (health.usagePercent > 95) {
          await clearNonEssentialCache(false); // Show toast
        }
      } catch (error) {
        if (isQuotaError(error)) {
          await clearNonEssentialCache(false);
        }
      }
    };

    // Check immediately
    checkStorageHealth();

    // Check every 5 minutes
    const interval = setInterval(checkStorageHealth, 5 * 60 * 1000);

    // Listen for storage errors globally
    const handleStorageError = (event: ErrorEvent) => {
      if (isQuotaError(event.error)) {
        clearNonEssentialCache(false);
        event.preventDefault(); // Prevent default error handling
      }
    };

    window.addEventListener('error', handleStorageError);

    return () => {
      mounted = false;
      clearInterval(interval);
      window.removeEventListener('error', handleStorageError);
    };
  }, [quotaWarningShown]);

  return null; // This component doesn't render anything visible
};

export default StorageQuotaHandler;
