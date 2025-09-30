# Commonly App Consolidation Guide

## Overview

This document outlines the standardized process for consolidating services and components within the Commonly app. The goal is to eliminate redundant code, standardize APIs, improve type safety, and enhance maintainability across the platform.

## Consolidation Principles

1. **Single Responsibility**: Each service should have a clear, well-defined responsibility
2. **Backward Compatibility**: Existing code must continue to work during the transition period
3. **Strong Typing**: All APIs must have comprehensive TypeScript interfaces and type definitions
4. **Consistent Error Handling**: Standardized approach to error handling and logging
5. **Security First**: Edge functions for sensitive operations, proper RLS policies
6. **Testability**: Comprehensive unit and integration tests for all functionality

## Standard Directory Structure

```
/src/services/[service-name]/
  /api/         - Core API functions
  /core/        - Types and constants
  /utils/       - Service-specific utilities
  /hooks/       - React hooks
  /components/  - Service-specific components
  /edge/        - Edge function interfaces and helpers
  /compatibility/ - Legacy compatibility layers
  /tests/       - Unit and integration tests
  README.md     - Service documentation
  index.ts      - Main export file
```

## Consolidation Process

### Phase 1: Analysis

1. **Inventory Existing Code**
   - Identify all implementations of similar functionality
   - Map function signatures and parameters
   - Document usage patterns across the codebase

2. **Define Core Types**
   - Create interfaces for all data structures
   - Define types for API requests/responses
   - Document required vs. optional fields

3. **Map Database Requirements**
   - Identify tables and columns needed
   - Plan schema migrations if necessary
   - Design RLS policies

### Phase 2: Design

1. **API Design**
   - Define clear function signatures
   - Document parameters and return types
   - Plan error handling strategy

2. **Compatibility Layer**
   - Map legacy functions to new API
   - Plan for graceful deprecation
   - Ensure zero breaking changes

3. **Edge Function Requirements**
   - Identify operations requiring server-side handling
   - Define request/response interfaces
   - Plan security measures

### Phase 3: Implementation

1. **Core Types**
   - Implement types directory first
   - Include JSDoc comments for all types
   - Define constants and enums

2. **API Implementation**
   - Implement core functionality
   - Add error handling
   - Include logging

3. **Edge Functions**
   - Implement secure server-side operations
   - Add proper validation and error handling
   - Deploy to Supabase

4. **Compatibility Layer**
   - Create wrappers for legacy code
   - Add deprecation warnings
   - Ensure full backward compatibility

5. **Tests**
   - Write unit tests for all API functions
   - Create mocks for external dependencies
   - Add integration tests for connected systems

### Phase 4: Deployment & Migration

1. **Database Migrations**
   - Apply schema changes in small, reversible batches
   - Validate data integrity
   - Update RLS policies

2. **Documentation**
   - Update service README.md
   - Add examples for common operations
   - Document migration path

3. **Gradual Adoption**
   - Start using new API in new code
   - Incrementally update existing code
   - Monitor for errors or issues

## Migration Strategy

1. **For New Code**:
   ```typescript
   // Import directly from consolidated API
   import { serviceAPI } from '@/services/service-name';
   ```

2. **For Existing Code**:
   ```typescript
   // Continue using legacy imports (they'll use compatibility layer)
   import { LegacyService } from '@/services/service-name';
   ```

3. **Gradual Migration**:
   ```typescript
   // Before
   import { LegacyService } from '@/services/service-name';
   await LegacyService.doSomething();
   
   // After
   import { serviceAPI } from '@/services/service-name';
   await serviceAPI.doSomething();
   ```

## Testing Guidelines

1. **Unit Testing**
   - Test each function independently
   - Mock external dependencies
   - Cover error cases and edge cases

2. **Integration Testing**
   - Test interaction between services
   - Verify database operations
   - Validate end-to-end flows

## RLS Policy Standards

1. **User Data**:
   ```sql
   CREATE POLICY "Users can view their own data" ON table_name
     FOR SELECT USING (auth.uid() = user_id);
   ```

2. **Organization Data**:
   ```sql
   CREATE POLICY "Users can access their organizations" ON table_name
     FOR SELECT USING (org_id IN (
       SELECT org_id FROM org_members WHERE user_id = auth.uid()
     ));
   ```

3. **Public/Private Data**:
   ```sql
   CREATE POLICY "Users can see public or their own data" ON table_name
     FOR SELECT USING (is_public OR auth.uid() = user_id);
   ```

## Example Consolidation Checklist

- [ ] Complete code inventory
- [ ] Define core types and interfaces
- [ ] Design API functions
- [ ] Implement core functionality
- [ ] Create database migrations
- [ ] Implement compatibility layer
- [ ] Write unit tests
- [ ] Deploy edge functions
- [ ] Update documentation
- [ ] Monitor adoption and errors

## Completed Consolidations

### Database Access Service

The Database Access Service consolidates all database interaction patterns into a strongly typed, modular system.

#### Structure

```
/src/services/database/
├── api/                   # Core database API components
│   ├── databaseClient.ts  # Low-level database client wrapper
│   ├── queryBuilders.ts   # SQL and filter query builders 
│   ├── rlsPolicies.ts     # RLS policy management
│   ├── tableOperations.ts # Table-specific operations
│   └── transactionManager.ts # Transaction management
├── compatibility/         # Backward compatibility layer
│   └── databaseService.ts # Legacy API functions
├── core/                  # Core types and utilities
│   └── types.ts           # TypeScript types and interfaces
├── hooks/                 # React hooks
│   └── useDatabase.tsx    # React hooks for database operations
├── tests/                 # Unit tests
│   ├── databaseClient.test.ts
│   ├── tableOperations.test.ts
│   └── databaseUtils.test.ts
├── utils/                 # Utility functions
│   └── databaseUtils.ts   # Common database utilities
└── index.ts              # Main entry point and API exports
```

#### Key Features

1. **Strongly Typed API**: Full TypeScript support for all database operations
2. **React Query Integration**: React hooks for data fetching with loading/error states
3. **Row Level Security Management**: Tools for consistent RLS policy application
4. **Transaction Management**: Simplified transaction workflow with savepoints
5. **Centralized Error Handling**: Custom DatabaseError with error categorization
6. **Query Building**: Tools to build complex filters, ordering, and pagination
7. **Caching Layer**: Performance optimization through selective caching
8. **Backward Compatibility**: Legacy API support for gradual migration

#### Migration Strategy

1. **For React Components**:
   ```tsx
   // Before
   const { data, error } = await supabase.from('users').select('*');
   
   // After
   import { useTableQuery } from '@/services/database';
   const { data, isLoading, error } = useTableQuery('users');
   ```

2. **For Server Functions**:
   ```ts
   // Before
   const { data } = await supabase.from('users').insert({ name: 'John' });
   
   // After
   import { createTableOperations } from '@/services/database';
   const userOps = createTableOperations('users');
   const result = await userOps.insert({ name: 'John' });
   ```

#### Key Learnings

- Start with comprehensive type definitions before implementation
- Plan error handling strategy early in the development process
- Design hooks with React Query patterns for consistency
- Provide both direct API access and React hooks for flexibility
- Create granular utility functions that can be composed
- Test error conditions extensively

## Storage Service Consolidation

### Structure

The Storage Service is organized into a modular structure to separate concerns and enable flexible integration:

```
/src/services/storage/
├── api/                   # Core storage API components
│   ├── storageClient.ts   # Low-level storage client wrapper
│   └── storageOperations.ts # High-level storage operations
├── compatibility/         # Backward compatibility layer
│   └── storageService.ts  # Legacy API functions
├── core/                  # Core types and utilities
│   └── types.ts           # TypeScript types and interfaces
├── hooks/                 # React hooks
│   └── useStorage.tsx     # React hooks for storage operations
├── tests/                 # Unit tests
│   ├── storageClient.test.ts
│   ├── storageOperations.test.ts
│   └── useStorage.test.tsx
├── index.ts               # Main entry point and API exports
└── README.md              # Documentation and examples
```

### Key Features

1. **Strongly Typed Storage Operations**:
   - Comprehensive TypeScript interfaces for all operations
   - Bucket enum for type-safe bucket references
   - Detailed error types for better error handling
   - File metadata interfaces for typed file properties

2. **Progress Tracking**:
   - Real-time upload progress tracking
   - Custom XMLHttpRequest implementation for direct signed URL uploads
   - Consistent progress reporting across all upload methods

3. **Content Organization**:
   - Specialized buckets for different content types (avatars, events, podcasts, etc.)
   - Structured file paths based on user and content IDs
   - Automatic metadata handling

4. **Error Handling and User Feedback**:
   - Custom error class with error categorization
   - Toast notifications integrated at various levels
   - Comprehensive error logging

5. **React Integration**:
   - Custom hooks for each storage operation type
   - React Query integration for asynchronous state management
   - File input handling utilities

6. **Security Features**:
   - MIME type validation
   - Automatic bucket initialization
   - Controlled public access settings

### Migration Strategy

1. **Identify Usages**:
   - Find direct `storageService.ts` and `supabaseStorage.ts` usages
   - Identify code patterns in components for file uploads and management

2. **Create Compatibility Layer**:
   - Implement backward compatible API in `compatibility/storageService.ts`
   - Add deprecation notices to guide future migration
   - Ensure all legacy method signatures are preserved

3. **Implement Core API**:
   - Develop low-level client first with direct Supabase interaction
   - Build higher-level operations with business logic and validation
   - Create React hooks for common upload patterns

4. **Gradual Migration**:
   - Replace direct storage operations with consolidated API in new components
   - Update existing components incrementally during feature work
   - Use integration examples (like `EventDetailsSection.tsx`) as reference implementations

5. **Testing Strategy**:
   - Unit tests for client, operations, and hooks
   - Integration tests for complete upload workflows
   - Mock Supabase storage interactions

### Key Learnings

- Prefer direct signed URL uploads for better progress tracking
- Implement consistent error handling across all layers
- Provide specialized hooks for different content types
- Balance type safety with API simplicity
- Plan for backward compatibility early in the process
- File organization standards improve discoverability
- Toast notifications provide crucial user feedback
- Comprehensive testing prevents regressions during migration
