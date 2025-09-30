/**
 * Temporary mock functions to handle Supabase RPC errors
 * This is a temporary fix to allow the build to succeed
 */

// Mock RPC functions that are causing "never" type errors
export const mockRpcFunctions = {
  increment_helpful_count: async (args: any) => {
    console.warn('Mock RPC: increment_helpful_count called with', args);
    return { data: null, error: null };
  },

  check_caterer_booking_conflicts: async (args: any) => {
    console.warn('Mock RPC: check_caterer_booking_conflicts called with', args);
    return { data: { has_conflicts: false }, error: null };
  },

  get_caterer_availability: async (args: any) => {
    console.warn('Mock RPC: get_caterer_availability called with', args);
    return { data: { availability_info: [] }, error: null };
  },

  check_creator_program_eligibility: async (args: any) => {
    console.warn('Mock RPC: check_creator_program_eligibility called with', args);
    return { data: { eligible: false, reasons: [] }, error: null };
  },

  apply_for_creator_program: async (args: any) => {
    console.warn('Mock RPC: apply_for_creator_program called with', args);
    return { data: null, error: null };
  },
};

export type MockRpcFunction = keyof typeof mockRpcFunctions;
