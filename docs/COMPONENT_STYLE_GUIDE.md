# Component Style Guide

This document outlines the coding standards and patterns for React components in the CommonlyApp project.

## Table of Contents

1. [Component Structure](#component-structure)
2. [TypeScript Guidelines](#typescript-guidelines)
3. [Props and Interfaces](#props-and-interfaces)
4. [State Management](#state-management)
5. [Error Handling](#error-handling)
6. [Performance Best Practices](#performance-best-practices)
7. [Testing Guidelines](#testing-guidelines)
8. [File Organization](#file-organization)

## Component Structure

### Basic Component Template

```tsx
/**
 * ComponentName - Brief description
 *
 * @example
 * <ComponentName prop1="value" onAction={handleAction} />
 */

import React from 'react';
import { ComponentNameProps } from './types';
import { useErrorHandler } from '@/lib/errors/ErrorHandler';

export const ComponentName: React.FC<ComponentNameProps> = ({
  prop1,
  prop2 = 'defaultValue',
  onAction,
  children,
  className,
  ...props
}) => {
  const { handleError } = useErrorHandler();

  // Hooks (in order: state, effects, custom hooks)
  const [state, setState] = React.useState('');

  React.useEffect(() => {
    // Effect logic
  }, []);

  // Event handlers
  const handleClick = React.useCallback((event: React.MouseEvent) => {
    try {
      onAction?.(event);
    } catch (error) {
      handleError(error, { component: 'ComponentName', action: 'click' });
    }
  }, [onAction]);

  // Early returns for loading/error states
  if (loading) {
    return <ComponentSkeleton />;
  }

  if (error) {
    return <ErrorDisplay error={error} onRetry={refetch} />;
  }

  // Main render
  return (
    <div className={cn('base-styles', className)} {...props}>
      {children}
    </div>
  );
};

ComponentName.displayName = 'ComponentName';
```

### Component Types File (types.ts)

```tsx
import { BaseComponentProps } from '@/types/common';

export interface ComponentNameProps extends BaseComponentProps {
  prop1: string;
  prop2?: string;
  onAction?: (event: React.MouseEvent) => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export interface ComponentNameState {
  field1: string;
  field2: boolean;
}
```

## TypeScript Guidelines

### 1. Strict Type Safety

```tsx
// ✅ Good - Explicit types
interface UserCardProps {
  user: User;
  onEdit: (userId: string) => void;
  isEditable?: boolean;
}

// ❌ Bad - Using 'any'
interface UserCardProps {
  user: any;
  onEdit: (data: any) => void;
}
```

### 2. Generic Components

```tsx
// ✅ Good - Generic component
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  keyExtractor: (item: T) => string;
}

export const List = <T,>({ items, renderItem, keyExtractor }: ListProps<T>) => {
  return (
    <ul>
      {items.map(item => (
        <li key={keyExtractor(item)}>
          {renderItem(item)}
        </li>
      ))}
    </ul>
  );
};
```

### 3. Event Handler Types

```tsx
// ✅ Good - Specific event types
interface FormProps {
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
}
```

## Props and Interfaces

### 1. Props Naming

```tsx
// ✅ Good - Clear, descriptive names
interface UserProfileProps {
  user: User;
  isEditable: boolean;
  onUserUpdate: (user: User) => void;
  showAvatar: boolean;
}

// ❌ Bad - Unclear names
interface UserProfileProps {
  data: any;
  editable: boolean;
  onUpdate: (data: any) => void;
  avatar: boolean;
}
```

### 2. Default Props

```tsx
// ✅ Good - Default parameters
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  children,
  ...props
}) => {
  // Component logic
};
```

### 3. Required vs Optional Props

```tsx
interface ComponentProps {
  // Required props first
  id: string;
  title: string;

  // Optional props after
  description?: string;
  className?: string;
  children?: React.ReactNode;
}
```

## State Management

### 1. Local State with useState

```tsx
// ✅ Good - Specific state shape
const [formData, setFormData] = useState<FormData>({
  name: '',
  email: '',
  preferences: {
    notifications: true,
    theme: 'light'
  }
});

// ✅ Good - Update pattern
const updateFormField = useCallback((field: keyof FormData, value: string) => {
  setFormData(prev => ({
    ...prev,
    [field]: value
  }));
}, []);
```

### 2. Global State with Zustand

```tsx
// ✅ Good - Using standardized store
import { useUserStore } from '@/store/userStore';

export const UserProfile = () => {
  const { user, loading, error } = useUserStore();
  const { updateProfile } = useUserStore(state => state.actions);

  if (loading) return <ProfileSkeleton />;
  if (error) return <ErrorDisplay error={error} />;

  return <div>{/* Profile content */}</div>;
};
```

## Error Handling

### 1. Component Error Boundaries

```tsx
export const FeatureSection = ({ children }: { children: React.ReactNode }) => {
  return (
    <ErrorBoundary
      fallback={<ErrorDisplay message="Failed to load feature" />}
      onError={(error, errorInfo) => {
        console.error('Feature error:', error, errorInfo);
      }}
    >
      {children}
    </ErrorBoundary>
  );
};
```

### 2. Async Error Handling

```tsx
export const DataFetcher = () => {
  const [data, setData] = useState(null);
  const { handleError } = useErrorHandler();

  const fetchData = useCallback(async () => {
    try {
      const result = await userService.getCurrentUser();
      if (result.success) {
        setData(result.data);
      } else {
        handleError(new Error(result.error?.message), { component: 'DataFetcher' });
      }
    } catch (error) {
      handleError(error, { component: 'DataFetcher', operation: 'fetchData' });
    }
  }, [handleError]);
};
```

## Performance Best Practices

### 1. React.memo for Pure Components

```tsx
// ✅ Good - Memoized component
export const UserCard = React.memo<UserCardProps>(({ user, onEdit }) => {
  return (
    <div>
      <h3>{user.name}</h3>
      <button onClick={() => onEdit(user.id)}>Edit</button>
    </div>
  );
});

UserCard.displayName = 'UserCard';
```

### 2. useCallback for Event Handlers

```tsx
// ✅ Good - Memoized handlers
export const TodoList = ({ todos, onToggle, onDelete }: TodoListProps) => {
  const handleToggle = useCallback((id: string) => {
    onToggle(id);
  }, [onToggle]);

  const handleDelete = useCallback((id: string) => {
    onDelete(id);
  }, [onDelete]);

  return (
    <ul>
      {todos.map(todo => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onToggle={handleToggle}
          onDelete={handleDelete}
        />
      ))}
    </ul>
  );
};
```

### 3. useMemo for Expensive Calculations

```tsx
// ✅ Good - Memoized calculations
export const UserStats = ({ users }: { users: User[] }) => {
  const stats = useMemo(() => {
    return {
      total: users.length,
      active: users.filter(u => u.isActive).length,
      premium: users.filter(u => u.isPremium).length
    };
  }, [users]);

  return <div>{/* Stats display */}</div>;
};
```

## Testing Guidelines

### 1. Component Testing

```tsx
// ComponentName.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ComponentName } from './ComponentName';

describe('ComponentName', () => {
  it('renders correctly', () => {
    render(<ComponentName prop1="test" />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('handles user interactions', () => {
    const mockHandler = jest.fn();
    render(<ComponentName onAction={mockHandler} />);

    fireEvent.click(screen.getByRole('button'));
    expect(mockHandler).toHaveBeenCalled();
  });
});
```

## File Organization

```
src/
├── components/
│   ├── ui/              # Reusable UI components
│   │   ├── Button/
│   │   │   ├── index.ts
│   │   │   ├── Button.tsx
│   │   │   ├── types.ts
│   │   │   └── Button.test.tsx
│   ├── features/        # Feature-specific components
│   │   ├── user/
│   │   │   ├── UserProfile/
│   │   │   └── UserList/
│   └── layout/          # Layout components
│       ├── Header/
│       └── Sidebar/
```

## Best Practices Summary

1. **Always use TypeScript** - No 'any' types
2. **Component composition** - Break down complex components
3. **Error boundaries** - Wrap features in error boundaries
4. **Performance optimization** - Use React.memo, useCallback, useMemo appropriately
5. **Consistent naming** - Use clear, descriptive names
6. **Proper state management** - Local state for component-specific data, global for shared data
7. **Accessibility** - Always include proper ARIA attributes
8. **Testing** - Write tests for all interactive components
9. **Documentation** - Include JSDoc comments for complex components

## Code Review Checklist

- [ ] Component follows the standard structure
- [ ] All props are properly typed
- [ ] Error handling is implemented
- [ ] Performance optimizations are in place where needed
- [ ] Component is properly tested
- [ ] Accessibility requirements are met
- [ ] Code is properly documented