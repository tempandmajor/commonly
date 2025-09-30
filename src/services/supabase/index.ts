/**
 * Supabase service
 * This is the main entry point for the Supabase service
 */

export * from './types';
export { supabaseService } from './client';

// Export a default instance for backward compatibility
import { supabaseService } from './client';
export default supabaseService;
