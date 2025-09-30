/**
 * Event Service
 *
 * This service provides functionality for managing events, including creation,
 * retrieval, updating, and deletion of events, as well as searching and filtering.
 *
 * The service follows a modular structure with separate modules for API functions,
 * React hooks, types, and utilities.
 */

// Export types
export * from './types';

// Export modernized API under a namespace to avoid conflicts
export { EventAPI };

// Export hooks for React components
export * from './hooks/useEvents';

// Maintain backward compatibility with existing code
export * from './queries';
export * from './search';
export * from './maintenance';
export * from './mutations';
export * from './streamService';
export * from '../catererService'; // Add caterer service export
