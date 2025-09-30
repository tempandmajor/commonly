# Database Access Service

This module provides a consolidated, strongly typed Database Access Service for the Commonly app platform, handling all database interactions with consistent patterns, error handling, and TypeScript support.

## Table of Contents

- [Architecture](#architecture)
- [Features](#features)
- [Usage Examples](#usage-examples)
  - [React Hooks](#react-hooks)
  - [Table Operations](#table-operations)
  - [Raw Queries](#raw-queries)
  - [Transactions](#transactions)
  - [RLS Policies](#rls-policies)
- [Migration Guide](#migration-guide)
- [API Reference](#api-reference)

## Architecture

The Database Access Service follows a modular architecture with several key components:

```
src/services/database/
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

## Features

- **Strongly Typed API**: Full TypeScript support for all database operations
- **Comprehensive Error Handling**: Centralized error handling with detailed context
- **React Integration**: React hooks for data fetching and mutations with React Query
- **Transaction Support**: Managed database transactions with savepoint support
- **Row Level Security**: Tools to manage Postgres RLS policies
- **Caching**: Optional query result caching for performance
- **Backward Compatibility**: Legacy API support for gradual migration
- **Debugging**: Optional debug mode with detailed logging
- **Unit Testing**: Comprehensive test coverage for reliability

## Usage Examples

### React Hooks

```tsx
import { useTableQuery, useRecordById, useCreateRecord } from '@/services/database';

// Fetch a list of users
function UserList() {
  const { data: users, isLoading, error } = useTableQuery('users', {
    filters: { is_active: true },
    order: [{ column: 'created_at', ascending: false }],
    pagination: { page: 1, pageSize: 20 },
  });
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <ul>
      {users.map(user => <li key={user.id}>{user.name}</li>)}
    </ul>
  );
}

// Fetch a single record
function UserProfile({ userId }) {
  const { data: user, isLoading } = useRecordById('users', userId);
  
  if (isLoading || !user) return <div>Loading...</div>;
  
  return <div>Name: {user.name}</div>;
}

// Create a new record
function CreateUserForm() {
  const { createRecord, isLoading } = useCreateRecord('users', {
    onSuccess: (user) => console.log('User created:', user),
  });
  
  const handleSubmit = (data) => {
    createRecord(data);
  };
  
  return <form onSubmit={handleSubmit}>...</form>;
}
```

### Table Operations

```ts
import { createTableOperations } from '@/services/database';

async function getUserData() {
  const userOps = createTableOperations('users');
  
  // Find all active users
  const activeUsers = await userOps.findAll({
    filters: { is_active: true }
  });
  
  // Find by ID
  const user = await userOps.findById(123);
  
  // Find by field
  const adminUsers = await userOps.findByField('role', 'admin');
  
  // Insert record
  const newUser = await userOps.insert({
    name: 'John Doe',
    email: 'john@example.com'
  });
  
  // Update record
  await userOps.update(123, { is_active: false });
  
  // Delete record
  await userOps.delete(456);
}
```

### Raw Queries

```ts
import { databaseClient } from '@/services/database';

async function runCustomQuery() {
  const { data, error } = await databaseClient.query(`
    SELECT users.name, COUNT(orders.id) as order_count
    FROM users
    LEFT JOIN orders ON users.id = orders.user_id
    GROUP BY users.id
    HAVING COUNT(orders.id) > $1
  `, [5]);
  
  if (error) {
    console.error('Query error:', error);
    return;
  }
  
  return data;
}
```

### Transactions

```ts
import { databaseUtils } from '@/services/database';

async function transferCredits(fromUserId: number, toUserId: number, amount: number) {
  return await databaseUtils.withTransaction(async (tx) => {
    // Deduct credits from first user
    await tx.query(
      'UPDATE users SET credits = credits - $1 WHERE id = $2',
      [amount, fromUserId]
    );
    
    // Add credits to second user
    await tx.query(
      'UPDATE users SET credits = credits + $1 WHERE id = $2',
      [amount, toUserId]
    );
    
    // Log the transaction
    await tx.query(
      'INSERT INTO credit_transfers (from_user, to_user, amount) VALUES ($1, $2, $3)',
      [fromUserId, toUserId, amount]
    );
  });
}
```

### RLS Policies

```ts
import { RlsPolicyManager } from '@/services/database';

async function setupUserPolicies() {
  const rlsManager = new RlsPolicyManager();
  
  // Enable RLS on users table
  await rlsManager.enableRls('users');
  
  // Create a policy where users can only see their own data
  await rlsManager.createPolicy({
    tableName: 'users',
    policyName: 'users_view_own',
    operation: 'SELECT',
    using: 'auth.uid() = id',
    withCheck: null,
    role: null,
  });
  
  // Apply common policy templates
  await rlsManager.applyOwnershipPolicy('orders', 'user_id');
  await rlsManager.applyRoleBasedPolicy('settings', 'admin');
}
```

## Migration Guide

This service consolidates and standardizes database access across the Commonly app platform. To migrate from the old approach:

1. **Replace direct Supabase client usage** with the database service:

   ```diff
   - import { supabase } from '@/lib/supabase';
   - const { data } = await supabase.from('users').select('*');
   + import { databaseClient } from '@/services/database';
   + const { data } = await databaseClient.select('users');
   ```

2. **Replace React Query hooks** with database service hooks:

   ```diff
   - import { useQuery } from '@tanstack/react-query';
   - const { data } = useQuery(['users'], fetchUsers);
   + import { useTableQuery } from '@/services/database';
   + const { data } = useTableQuery('users');
   ```

3. **For legacy code**, use the backward compatibility layer temporarily:

   ```ts
   import { legacyDatabaseService } from '@/services/database';
   
   // These work like before but are marked as deprecated
   const { data } = await legacyDatabaseService.fetchTable('users');
   ```

4. **Update your error handling** to use the new DatabaseError type:

   ```ts
   import { DatabaseErrorType } from '@/services/database';
   
   const { data, error } = await databaseClient.select('users');
   
   if (error) {
    if (error.type === DatabaseErrorType.PERMISSION_ERROR) {
      // Handle permission errors
    } else {
      // Handle other errors
    }
   }
   ```

## API Reference

For complete API documentation, see the inline JSDoc comments in each module file.

### Core Modules

- **databaseClient**: Low-level database client wrapper
- **tableOperations**: Table-specific CRUD operations
- **transactionManager**: Transaction management
- **RlsPolicyManager**: Row Level Security policy management
- **databaseUtils**: Utility functions for database operations

### React Hooks

- **useTableQuery**: Query table data with filters, ordering, pagination
- **useRecordById**: Get a single record by ID
- **useRecordsByField**: Get records by a field value
- **useCreateRecord**: Create a new record
- **useUpdateRecord**: Update an existing record
- **useDeleteRecord**: Delete a record
- **useRawQuery**: Execute a raw SQL query
- **usePaginatedQuery**: Query with pagination controls
- **useTable**: All-in-one hook for table operations
