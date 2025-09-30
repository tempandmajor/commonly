# Service Consolidation Guide

This document provides guidelines and patterns for consolidating services in the Commonly app to improve maintainability, type safety, and developer experience.

## Current Consolidation Status

### Completed Services

1. **Authentication Service** 
   - Status: ✅ Complete
   - Location: `src/services/auth/`
   - Features: User authentication, session management, profile updates

2. **Storage Service**
   - Status: ✅ Complete  
   - Location: `src/services/storage/`
   - Features: File upload/download, URL generation, image processing

3. **Analytics Service**
   - Status: ✅ Complete
   - Location: `src/services/analytics/`
   - Features: Event tracking, page views, user identification, performance metrics

4. **Notification Service**
   - Status: ✅ Complete
   - Location: `src/services/notification/`
   - Features: Toast notifications, in-app notifications, extensibility for email/push

5. **Ticket Service**
   - Status: ✅ Complete
   - Location: `src/services/ticket/`
   - Features: Ticket operations, inventory management, validation workflows

6. **Message Service**
   - Status: ✅ Complete
   - Location: `src/services/message/`
   - Features: Conversation management, message sending, read status tracking

7. **Content Management**
   - Status: ✅ Complete
   - Location: `src/services/content/`
   - Features: Page content, creator/sponsor content unified API

8. **Promotion Service**
   - Status: ✅ Complete
   - Location: `src/services/promotion/`
   - Features: Core API, credits, analytics, and caching

9. **Order Service**
   - Status: ✅ Complete
   - Location: `src/services/order/`
   - Features: Comprehensive type system, API, analytics, and receipts

10. **Validation Service**
    - Status: ✅ Complete
    - Location: `src/services/validation/`
    - Features: Form validation, dynamic schema support, caching

### Planned Services

1. **Payment Service**
   - Status: ⏳ Planned
   - Current Location: Various files in `src/services/payment/`, `src/services/stripe/`

2. **User Service**
   - Status: ⏳ Planned
   - Current Location: Various files related to user management beyond auth

3. **Search Service**
   - Status: ⏳ Planned
   - Current Location: Various search-related functionality spread across files

## Consolidation Pattern

All consolidated services follow this common structure:

```
/src/services/[service-name]/
  /api/         - Core API functions
  /core/        - Types and interfaces
  /hooks/       - React hooks
  /utils/       - Utility functions
  /compatibility/ - Legacy compatibility layers
  /tests/       - Unit and integration tests
  README.md     - Documentation
  index.ts      - Main exports
```

### File Purposes

1. **`core/types.ts`**: Define all TypeScript interfaces, types, enums, and error classes.

2. **`api/[service]API.ts`**: Implement core functionality independent of React.

3. **`hooks/use[Service].tsx`**: Create React hooks that wrap the API for component use.

4. **`compatibility/[legacy].ts`**: Maintain backward compatibility with existing code.

5. **`utils/[util].ts`**: Helper functions specific to this service.

6. **`tests/[file].test.ts`**: Unit tests for the service.

7. **`README.md`**: Document usage, API reference, and migration strategy.

8. **`index.ts`**: Export all public APIs, hooks, and types.

## Standard Implementation Approach

### Step 1: Core Types

Define all types, interfaces, and enums first. This creates the contract for your service.

```typescript
// core/types.ts
export interface User {
  id: string;
  name: string;
  // ...
}

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  // ...
}

export class ServiceError extends Error {
  // ...
}
```

### Step 2: Core API

Implement the service functionality independent of React:

```typescript
// api/serviceAPI.ts
import { User, UserRole } from '../core/types';

// Core functions
export const getUser = async (id: string): Promise<User> => {
  // Implementation
};

// Export as a unified object
export const serviceAPI = {
  getUser,
  // Other functions
};
```

### Step 3: React Hooks

Create React hooks that wrap the API:

```typescript
// hooks/useService.tsx
import { useState } from 'react';
import { serviceAPI } from '../api/serviceAPI';

export const useService = () => {
  // Hook implementation
  
  return {
    // Exposed functionality
  };
};
```

### Step 4: Backward Compatibility

Create layers that maintain existing APIs:

```typescript
// compatibility/legacyService.ts
import { serviceAPI } from '../api/serviceAPI';

/** @deprecated Use serviceAPI directly */
export class LegacyService {
  static async getUser(id: string) {
    console.warn('Deprecated: Use serviceAPI.getUser instead');
    return serviceAPI.getUser(id);
  }
}
```

### Step 5: Main Export

Export all public APIs:

```typescript
// index.ts
export { serviceAPI } from './api/serviceAPI';
export { useService } from './hooks/useService';
export * from './core/types';
export { LegacyService } from './compatibility/legacyService';
```

### Step 6: Documentation

Create comprehensive documentation:

```markdown
# Service Name

Description of the service...

## Usage
...

## API Reference
...

## Migration Strategy
...
```

### Step 7: Testing

Write unit and integration tests:

```typescript
// tests/serviceAPI.test.ts
import { describe, it, expect } from 'vitest';
import { serviceAPI } from '../api/serviceAPI';

describe('Service API', () => {
  it('should get user by id', async () => {
    // Test implementation
  });
});
```

## Best Practices

1. **Strong Typing**: Use TypeScript interfaces and type-guards extensively.

2. **Backward Compatibility**: Always maintain compatibility with existing code.

3. **Documentation**: Document public APIs, examples, and migration strategies.

4. **Testing**: Write unit tests for core functionality and integration tests for complex workflows.

5. **Error Handling**: Implement consistent error handling with custom error classes.

6. **Logging**: Include appropriate logging throughout the service.

7. **React Integration**: Create hooks that follow React best practices.

8. **Performance**: Implement caching and optimizations where appropriate.

9. **Security**: Follow security best practices, especially for sensitive operations.

10. **Modularity**: Keep functions small and focused on a single responsibility.

## Migration Strategy

1. **Identify Target Service**: Choose a service with clear boundaries for consolidation.

2. **Map Existing Code**: Identify all related files and functionality.

3. **Define Core Types**: Create TypeScript interfaces for the service.

4. **Implement Core API**: Build the service independent of React.

5. **Create React Hooks**: Wrap the API with React hooks.

6. **Backward Compatibility**: Create compatibility layers for existing code.

7. **Documentation**: Write comprehensive documentation.

8. **Testing**: Write tests for the service.

9. **Gradual Migration**: Update existing components to use the new service incrementally.

## Tips for Successful Consolidation

1. **Start Small**: Begin with smaller, well-defined services.

2. **Monitor Performance**: Watch for regressions as you consolidate.

3. **Get Feedback**: Have other developers review and test your consolidated services.

4. **Update Dependencies**: Ensure all dependencies are properly managed.

5. **Track Progress**: Use a spreadsheet or task tracker to monitor migration progress.

6. **Celebrate Wins**: Acknowledge each successful consolidation!

## Future Considerations

1. **Service Integration**: Consider how consolidated services will work together.

2. **State Management**: Evaluate the need for global state management solutions.

3. **API Consistency**: Ensure consistent naming and patterns across services.

4. **Documentation**: Keep documentation updated as services evolve.

5. **Training**: Provide training for developers on using consolidated services.

---

Document last updated: July 2, 2025
