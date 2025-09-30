# Storage Service

This service provides a comprehensive, strongly-typed API for managing file storage operations in the Commonly app. It wraps Supabase Storage functionality with enhanced error handling, type safety, and React integration.

## Architecture

The Storage Service follows a modular structure:

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
│   └── storageOperations.test.ts
└── index.ts               # Main entry point and API exports
```

## Features

- **Strongly Typed API**: Comprehensive TypeScript interfaces for all operations
- **Progress Tracking**: Upload progress tracking for better UX
- **Error Handling**: Enhanced error handling with custom error types
- **React Integration**: Hooks for easy integration with React components
- **Bucket Management**: Automatic bucket initialization and configuration
- **File Organization**: Structured file paths based on user and content IDs
- **Content Validation**: MIME type validation for specific content types
- **Toast Notifications**: User feedback for success and error states
- **Backward Compatibility**: Legacy API support for gradual migration

## Usage Examples

### Basic File Upload

```typescript
import { storageOperations, StorageBucket } from '@/services/storage';

// Upload a file
const handleFileUpload = async (file: File) => {
  const result = await storageOperations.uploadGenericFile(
    file,
    userId,
    'documents',
    (progress) => {
      console.log(`Upload progress: ${progress.progress}%`);
    }
  );

  if (result.success) {
    console.log(`File uploaded: ${result.url}`);
  } else {
    console.error(`Upload failed: ${result.error}`);
  }
};
```

### Using React Hooks

```tsx
import { useAvatarUpload } from '@/services/storage';

const ProfilePicture = () => {
  const { 
    file, 
    progress, 
    uploadAvatar, 
    handleFileChange, 
    isUploading 
  } = useAvatarUpload({
    onSuccess: (result) => {
      console.log(`Avatar uploaded: ${result.url}`);
      updateUserProfile({ avatarUrl: result.url });
    }
  });

  return (
    <div>
      <input 
        type="file" 
        accept="image/*" 
        onChange={handleFileChange} 
        disabled={isUploading} 
      />
      
      {isUploading && (
        <div>Uploading: {progress.progress}%</div>
      )}
      
      <button 
        onClick={uploadAvatar}
        disabled={!file || isUploading}
      >
        Upload Avatar
      </button>
    </div>
  );
};
```

### Listing Files

```tsx
import { useListFiles, StorageBucket } from '@/services/storage';

const UserFiles = ({ userId }) => {
  const { data: files, isLoading, error } = useListFiles(
    StorageBucket.GENERAL, 
    {
      prefix: userId,
      limit: 20,
      sortBy: {
        column: 'created_at',
        order: 'desc'
      }
    }
  );

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading files</div>;

  return (
    <ul>
      {files?.map(file => (
        <li key={file.name}>
          <a href={file.url}>{file.name}</a>
          <span>Size: {formatBytes(file.size)}</span>
        </li>
      ))}
    </ul>
  );
};
```

### Deleting Files

```tsx
import { useDeleteFile } from '@/services/storage';

const FileItem = ({ fileUrl, onDeleted }) => {
  const { mutate: deleteFile, isLoading } = useDeleteFile({
    onSuccess: onDeleted
  });

  return (
    <div>
      <button 
        onClick={() => deleteFile(fileUrl)}
        disabled={isLoading}
      >
        {isLoading ? 'Deleting...' : 'Delete'}
      </button>
    </div>
  );
};
```

### Event Image Upload

```tsx
import { useEventImageUpload } from '@/services/storage';

const EventBannerUpload = ({ eventId }) => {
  const {
    file,
    progress,
    uploadEventImage,
    handleFileChange,
    isUploading
  } = useEventImageUpload(eventId, {
    onSuccess: (result) => {
      updateEvent(eventId, { bannerUrl: result.url });
    }
  });

  return (
    <div>
      <input 
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={isUploading}
      />
      
      {isUploading && (
        <div>Uploading: {progress.progress}%</div>
      )}
      
      <button
        onClick={() => uploadEventImage('banner')}
        disabled={!file || isUploading}
      >
        Upload Banner
      </button>
    </div>
  );
};
```

## Migration Guide

### From Legacy Code

Legacy code can continue to use the existing functions, which now internally call the new consolidated API:

```typescript
// Legacy code (still works)
import { uploadFile, deleteFile } from '@/services/storage';

await uploadFile(file, 'avatars', `users/${userId}/profile.jpg`);
```

### To New API

New code should use the consolidated API directly:

```typescript
// New code pattern
import { storageOperations } from '@/services/storage';

await storageOperations.uploadAvatar(file, userId);
```

### React Component Migration

```tsx
// Before
import { useState } from 'react';
import { uploadFile } from '@/services/storage';

const OldUploadComponent = () => {
  const [isUploading, setIsUploading] = useState(false);
  
  const handleUpload = async (file) => {
    setIsUploading(true);
    try {
      const { url } = await uploadFile(file, 'general', `users/${userId}/${file.name}`);
      console.log('Uploaded:', url);
    } catch (error) {
      console.error('Upload failed', error);
    } finally {
      setIsUploading(false);
    }
  };
  
  // Component JSX...
};

// After
import { useUpload } from '@/services/storage';

const NewUploadComponent = () => {
  const { 
    file, 
    progress, 
    isUploading, 
    upload, 
    handleFileChange 
  } = useUpload({
    onSuccess: (result) => console.log('Uploaded:', result.url)
  });
  
  const handleUpload = () => {
    upload({
      bucket: 'general',
      path: `users/${userId}/${file?.name}`,
      file: file!
    });
  };
  
  // Component JSX with progress tracking...
};
```

## Best Practices

1. **Use Strongly Typed Enums**: Use `StorageBucket` enum instead of string literals
2. **Track Upload Progress**: Always provide progress feedback for large files
3. **Handle Errors**: Implement proper error handling for all storage operations
4. **Use React Hooks**: Prefer hooks over direct API calls in React components
5. **Validate File Types**: Check file types before uploading to prevent invalid uploads
6. **Implement Caching**: Cache frequently accessed files when appropriate
7. **Use Structured Paths**: Follow the userId/entityId/filename pattern for organization
8. **Clean Up Unused Files**: Delete files when the associated content is deleted

## API Reference

See the TypeScript interfaces in `core/types.ts` for detailed API documentation.
