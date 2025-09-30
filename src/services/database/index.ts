/**
 * Database Access Service - Main Entry Point
 *
 * This file exports the consolidated Database Access Service API.
 * It provides access to all components of the database service while
 * maintaining a clean and organized public interface.
 */

// Core Types
export * from './core/types';

// API Components
export { databaseClient } from './api/databaseClient';
export { createTableOperations, tablesMap } from './api/tableOperations';
export { transactionManager } from './api/transactionManager';
export { RlsPolicyManager } from './api/rlsPolicies';

// React Hooks
export {
  useTableQuery,
  useRecordById,
  useRecordsByField,
  useCreateRecord,
  useUpdateRecord,
  useDeleteRecord,
  useRawQuery,
  usePaginatedQuery,
  useTable,
} from './hooks/useDatabase';

// Utilities
export { databaseUtils } from './utils/databaseUtils';

// Internal imports for the service object
import { databaseClient } from './api/databaseClient';
import { createTableOperations, tablesMap } from './api/tableOperations';
import { transactionManager } from './api/transactionManager';
import { RlsPolicyManager } from './api/rlsPolicies';
import { databaseUtils } from './utils/databaseUtils';

// Backward Compatibility Layer
// Note: These are deprecated and will eventually be removed
// export { legacyDatabaseService }; // Removed - not defined

/**
 * The Database Service provides a comprehensive set of utilities
 * for interacting with the application's database.
 *
 * Core Features:
 * - Strongly typed database operations
 * - React hooks for data fetching and mutations
 * - Transaction management
 * - RLS policy management
 * - Utility functions for common database operations
 * - Backward compatibility with legacy database code
 *
 * Example Usage:
 *
 * ```tsx
 * // Using React hooks
 * const UserList = () => {
 *   const { data, isLoading } = useTableQuery('users', {
 *     filters: { is_active: true },
 *     order: [{ column: 'created_at', ascending: false }]
 *   });
 *
 *   if (isLoading) return <p>Loading...</p>;
 *
 *   return (
 *     <ul>
 *       {data.map(user => (
 *         <li key={user.id}>{user.name}</li>
 *       ))}
 *     </ul>
 *   );
 * }
 *
 * // Using table operations
 * const userOps = createTableOperations('users');
 * const result = await userOps.findById(123);
 *
 * // Using transaction manager
 * await databaseUtils.withTransaction(async (tx) => {
 *   await tx.query('INSERT INTO logs (message) VALUES ($1)', ['Transaction started']);
 *   // More operations...
 * });
 * ```
 */

// Main database service object with all components
const databaseService = {
  client: databaseClient,
  tables: tablesMap,
  createTableOps: createTableOperations,
  transactions: transactionManager,
  utils: databaseUtils,

  // Create a new RLS Policy Manager instance
  createRlsPolicyManager: (options?: { debug?: boolean }) => new RlsPolicyManager(options),

  // For direct import compatibility, re-export the legacy API
  // legacy: legacyDatabaseService, // Removed - not defined
};

// Default export of the complete database service
export default databaseService;
