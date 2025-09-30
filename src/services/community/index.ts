/**
 * Community Service
 *
 * A modular service for managing communities, memberships, and subscriptions.
 * Replaces the previous implementation that used ContentTest table as a placeholder.
 */

// Export API functions
export * from './api/core';
export * from './subscription/api';

// Export React hooks
export * from './hooks/useCommunity';
export * from './subscription/hooks';

// Export types
export * from './types';

// Export backward compatibility layer - removed as it was not defined
