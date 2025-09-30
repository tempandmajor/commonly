import { SearchFilters, SearchResult, SearchOptions } from '../types';
import { searchCache } from '../cache';
import { supabase } from '@/integrations/supabase/client';

interface User {
  id: string;
  name: string;
  email: string;
  username?: string | undefined;
}

export const searchUsers = async (
  query: string,
  filters?: SearchFilters,
  options?: SearchOptions
): Promise<SearchResult<User>> => {
  const cacheKey = `users:${query}:${JSON.stringify(filters)}:${JSON.stringify(options)}`;

  // Check cache first
  const cached = searchCache.get<SearchResult<User>>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    // Build the query
    let dbQuery = supabase
      .from('profiles')
      .select('id, first_name, last_name, email, username')
      .limit(options?.limit || 20);

    // Add search filters
    if (query) {
      dbQuery = dbQuery.or(
        `first_name.ilike.%${query}%,last_name.ilike.%${query}%,username.ilike.%${query}%,email.ilike.%${query}%`
      );
    }

    // Apply additional filters
    if (filters?.verified) {
      dbQuery = dbQuery.eq('email_verified', true);
    }

    const { data, error } = await dbQuery;

    if (error) {
      throw error;
    }

    // Transform to expected format
    const users: User[] = (data || []).map(profile => ({
      id: profile.id,
      name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Anonymous User',
      email: profile.email || '',
      username: profile.username || undefined,
    }));

    const result: SearchResult<User> = {
      items: users,
      total: users.length,
      hasMore: users.length === (options?.limit || 20),
    };

    // Cache the result
    searchCache.set(cacheKey, result);

    return result;
  } catch (error) {
    console.error('Error searching users:', error);

    // Return empty result on error
    const result: SearchResult<User> = {
      items: [],
      total: 0,
      hasMore: false,
    };

    return result;
  }
};
