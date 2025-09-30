# Community Service

This module provides a comprehensive API for managing communities, memberships, and subscriptions in the Commonly app. It replaces the previous implementation that used the `ContentTest` table as a placeholder.

## Structure

The community service follows the modular structure pattern used across other consolidated services:

```
community/
├── api/
│   └── core.ts             # Core API functions for community management
├── hooks/
│   └── useCommunity.tsx    # React hooks for community operations
├── subscription/
│   ├── api.ts              # API functions for subscription management
│   └── hooks.tsx           # React hooks for subscription operations
├── utils/
│   └── cache.ts            # Caching utilities
├── compatibility/
│   └── communityService.ts # Backward compatibility layer
├── types.ts                # TypeScript types and interfaces
├── index.ts                # Main entry point
└── README.md               # Documentation
```

## Features

- **Community Management**: Create, read, update, and delete communities
- **Membership Management**: Join/leave communities, manage roles
- **Subscription Management**: Enable paid subscriptions for communities
- **Event Management**: Create and manage events for community subscribers
- **Caching**: Performance optimization for frequently accessed data
- **TypeScript Support**: Comprehensive type definitions
- **React Integration**: React hooks for all operations

## Usage Examples

### Community Management

```typescript
import { 
  getCommunity, 
  createCommunity, 
  updateCommunity,
  deleteCommunity,
  searchCommunities
} from '@/services/community';

// Get a community by ID
const community = await getCommunity('community-id');

// Create a new community
const newCommunity = await createCommunity({
  name: 'My Community',
  description: 'A community for everyone',
  tags: ['tech', 'programming'],
  location: 'San Francisco, CA',
  is_private: false,
  owner_id: 'user-id'
});

// Update a community
const updatedCommunity = await updateCommunity('community-id', {
  description: 'Updated description'
});

// Delete a community
const success = await deleteCommunity('community-id');

// Search communities with filters
const results = await searchCommunities({
  query: 'tech',
  tags: ['programming'],
  location: 'San Francisco',
  page: 1,
  pageSize: 10
});
```

### Membership Management

```typescript
import { 
  joinCommunity, 
  leaveCommunity, 
  getCommunityMembers,
  updateMemberRole
} from '@/services/community';

// Join a community
await joinCommunity('community-id', 'user-id', 'member');

// Leave a community
await leaveCommunity('community-id', 'user-id');

// Get community members
const { members, total, hasMore } = await getCommunityMembers('community-id');

// Update a member's role
await updateMemberRole('community-id', 'user-id', 'admin');
```

### Subscription Management

```typescript
import { 
  getCommunitySubscriptionSettings, 
  updateCommunitySubscriptionSettings,
  subscribeToCommunity,
  unsubscribeFromCommunity
} from '@/services/community';

// Get subscription settings
const settings = await getCommunitySubscriptionSettings('community-id');

// Update subscription settings
await updateCommunitySubscriptionSettings('community-id', {
  isSubscriptionEnabled: true,
  monthlyPrice: 9.99,
  yearlyPrice: 99.99,
  features: ['Exclusive content', 'Monthly events']
});

// Subscribe to a community
await subscribeToCommunity('community-id', 'user-id', 'month');

// Unsubscribe from a community
await unsubscribeFromCommunity('community-id', 'user-id');
```

### React Hooks

```tsx
import { 
  useCommunity,
  useSearchCommunities,
  useUserCommunities,
  useJoinCommunity,
  useLeaveCommunity,
  useCommunitySubscriptionSettings
} from '@/services/community';

// In a React component
const CommunityDetails = ({ communityId }) => {
  // Get community data
  const { data: community, isLoading, error } = useCommunity(communityId);
  
  // Join a community
  const joinMutation = useJoinCommunity();
  const handleJoin = () => joinMutation.mutate({ communityId });
  
  // Get subscription settings
  const { data: subscriptionSettings } = useCommunitySubscriptionSettings(communityId);
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading community</div>;
  
  return (
    <div>
      <h1>{community.name}</h1>
      <p>{community.description}</p>
      {!community.is_member && (
        <button onClick={handleJoin} disabled={joinMutation.isLoading}>
          {joinMutation.isLoading ? 'Joining...' : 'Join Community'}
        </button>
      )}
      {subscriptionSettings?.isSubscriptionEnabled && (
        <div>
          <h2>Subscription</h2>
          <p>Monthly: ${subscriptionSettings.monthlyPrice}</p>
          <p>Yearly: ${subscriptionSettings.yearlyPrice}</p>
        </div>
      )}
    </div>
  );
};
```

## Database Schema

The community service uses the following tables:

- `communities`: Stores community information
- `community_members`: Tracks community memberships
- `community_subscription_settings`: Stores subscription configuration
- `community_subscribers`: Tracks active subscribers
- `community_events`: Stores community events

## Backward Compatibility

For backward compatibility with existing code, all functions from the old `communityService.ts` are re-exported through the compatibility layer. However, it's recommended to migrate to the new modular API for new code.

```typescript
// Old way (deprecated)
import { getCommunity } from '@/services/communityService';

// New way (recommended)
import { getCommunity } from '@/services/community';
```

## Error Handling

All API functions include comprehensive error handling and logging. Errors are logged to the console and appropriate fallback values are returned (null, empty array, or false depending on the function).

## Performance Considerations

- The service includes caching for frequently accessed data
- Database queries use appropriate indexes for performance
- Pagination is implemented for large result sets

## Security

- All database operations respect Row Level Security (RLS) policies
- Stripe integration is handled securely through Edge Functions
- User permissions are enforced at the database level
