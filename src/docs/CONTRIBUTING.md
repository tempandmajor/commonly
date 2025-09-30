
# Contributing to the Project

This document outlines the standards, conventions, and practices for contributing to our project.

## File Naming Conventions

We follow these file naming conventions to maintain consistency and clarity in our codebase:

### React Components

- Use **PascalCase** for component file names
- Example: `Button.tsx`, `UserProfile.tsx`, `PaymentForm.tsx`

### React Hooks

- Use **camelCase** with the `use` prefix
- Example: `useAuth.tsx`, `useForm.ts`, `useLocalStorage.ts`

### Service/Utility Files

- Use **camelCase** for service and utility files
- Example: `userService.ts`, `dateUtils.ts`, `platformCredit.ts`

### Type Definition Files

- Use **camelCase** for type definitions
- Example: `types.ts`, `userTypes.ts`, `paymentTypes.ts`

### Route Files

- Use **camelCase** for route files
- Example: `routes.tsx`, `adminRoutes.tsx`, `publicRoutes.tsx`

### Test Files

- Follow the same naming convention as the file being tested, with `.test` or `.spec` suffix
- Example: `Button.test.tsx`, `userService.spec.ts`

## Import Ordering

1. External libraries/frameworks
2. Internal modules
3. Components
4. Hooks
5. Types and interfaces
6. Utilities
7. Assets (images, styles, etc.)

## Code Style and Formatting

- Use TypeScript for all new components and files
- Use functional components with hooks for React components
- Follow the existing indentation (2 spaces) and formatting conventions
- Use interface for object type definitions, type for union types
- Add JSDoc comments for functions and components

## Commit Conventions

- Write clear, concise commit messages
- Use present tense ("Add feature" not "Added feature")
- Refer to issue numbers where applicable

## Pull Request Process

1. Update the README.md or documentation with details of changes if necessary
2. Ensure code passes all tests and linting
3. Update the CHANGELOG.md with details of changes
4. Merge only after review and approval
