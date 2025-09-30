import React, { createContext, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SupabaseContextType {
  supabase: typeof supabase;
  isInitialized: boolean;
}

const SupabaseContext = createContext<SupabaseContextType>({
  supabase,
  isInitialized: true,
});

export const useSupabase = () => {
  return useContext(SupabaseContext);
};

export const SupabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <SupabaseContext.Provider
      value={{
        supabase,
        isInitialized: true,
      }}
    >
      {children}
    </SupabaseContext.Provider>
  );
};
