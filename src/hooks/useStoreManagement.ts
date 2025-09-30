import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useStoreManagement = (userId: string) => {
  const [hasStore, setHasStore] = useState(false);

  const handleStoreCreation = async (value: boolean): Promise<void> => {
    try {
      setHasStore(value);

      // Update the user's preferences to include store status
      const { error } = await supabase
        .from('users')
        .update({
          preferences: { hasStore: value },
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;

      return;
    } catch (error) {
      setHasStore(!value); // Revert on error
    }
  };

  return {
    hasStore,
    setHasStore,
    handleStoreCreation,
  };
};
