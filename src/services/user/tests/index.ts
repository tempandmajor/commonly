/**
 * @file Entry point for User Service tests
 *
 * This file allows running all User Service tests together
 * with the command: npx vitest run -c vitest.config.ts "src/services/user/tests"
 */

// Import test setup
import './setup';

// Import all test files
import './api.test';
import './hooks.test';

// Export nothing - this file is just for test organization
export {};
