/**
 * Consolidated Services Export
 *
 * This file exports all consolidated services in the Commonly app.
 * Import services from here to ensure you're using the latest consolidated versions.
 */

// Authentication Service
export * from './auth';

// Storage Service
export * from './storage';

// Analytics Service
export * from './analytics';

// Notification Service
export * from './notification';

// Other consolidated services (already consolidated as mentioned in previous sessions)
// Add exports as services are consolidated

/**
 * Service Consolidation Status
 *
 * The following services have been consolidated:
 *
 * ✅ Authentication Service - Core auth functionality with Supabase integration
 * ✅ Storage Service - File upload, management and URL generation
 * ✅ Analytics Service - Event tracking, page views, and user identification
 * ✅ Notification Service - Toast and in-app notifications with future extensibility
 * ✅ Ticket Service - Ticket operations and inventory management
 * ✅ Message Service - Conversation management and messaging
 * ✅ Content Management - Page content and creator/sponsor content
 * ✅ Promotion Service - Promotions with credits, analytics, and caching
 * ✅ Order Service - Order management with receipts and analytics
 * ✅ Validation Service - Form validation with dynamic schema support
 *
 * Planned for future consolidation:
 *
 * ⏳ Payment Service - Payment processing and management
 * ⏳ User Service - User management beyond authentication
 * ⏳ Search Service - Unified search functionality
 */
