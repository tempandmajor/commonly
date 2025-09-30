import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { managementAPI } from '@/services/api/managementAPI';

export const useManagementData = () => {
  const [managementData, setManagementData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchManagementData = async () => {
      try {
        setIsLoading(true);
        const data = await managementAPI.getManagementData();
        setManagementData(data);
        setError(null);
      } catch (err) {
        setError('Failed to load management data');
        toast.error('Failed to load management data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchManagementData();
  }, []);

  return { managementData, isLoading, error };
};
