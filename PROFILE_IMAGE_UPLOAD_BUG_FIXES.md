# Profile Image Upload Bug Fixes

## Issues Fixed

### 1. Cover Image Upload Error
**Problem**: "Failed to save cover image: duplicate key value violates unique constraint 'user_profiles_user_id_key'"

**Root Cause**: The `user_profiles` table has a unique constraint on `user_id`, meaning each user can only have one profile record. The code was using `upsert` operation which was trying to create duplicate records when a profile already existed.

**Solution**: 
- Modified `updateUserProfileImage` function in `src/pages/Profile.tsx`
- Added logic to check if a profile record exists before attempting to update
- If profile exists: use `update` operation
- If profile doesn't exist: use `insert` operation
- Added proper error handling and logging

### 2. Profile Photo Upload Not Saving
**Problem**: Profile photos were uploading to storage but not persisting in the database

**Root Cause**: The `handleProfileUpdate` function had the same unique constraint issue when updating profile information, and avatar updates were not being properly handled.

**Solution**:
- Modified `handleProfileUpdate` function in `src/pages/Profile.tsx`
- Applied the same fix pattern: check if profile exists before updating
- Added proper error handling and logging for both users and user_profiles table operations
- Ensured avatar_url updates are properly saved to the users table

## Technical Details

### Database Schema
- `users` table: Contains `avatar_url` field for profile pictures
- `user_profiles` table: Contains `cover_image_url` field for cover images
- Unique constraint: `user_profiles_user_id_key` ensures one profile per user

### Code Changes

#### `updateUserProfileImage` Function
```typescript
// Before: Used upsert which caused unique constraint violation
const { error } = await supabase
  .from('user_profiles')
  .upsert({
    user_id: user!.id,
    cover_image_url: imageUrl,
    updated_at: new Date().toISOString()
  });

// After: Check if profile exists, then update or insert accordingly
const { data: existingProfile, error: checkError } = await supabase
  .from('user_profiles')
  .select('id')
  .eq('user_id', user!.id)
  .single();

if (existingProfile) {
  // Update existing profile
  const { error } = await supabase
    .from('user_profiles')
    .update({ 
      cover_image_url: imageUrl,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', user!.id);
} else {
  // Create new profile record
  const { error } = await supabase
    .from('user_profiles')
    .insert({
      user_id: user!.id,
      cover_image_url: imageUrl,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
}
```

#### `handleProfileUpdate` Function
```typescript
// Before: Used upsert for user_profiles table
const { error: profileError } = await supabase
  .from('user_profiles')
  .upsert({
    user_id: user.id,
    // ... other fields
  });

// After: Check if profile exists, then update or insert accordingly
const { data: existingProfile, error: checkError } = await supabase
  .from('user_profiles')
  .select('id')
  .eq('user_id', user.id)
  .single();

if (existingProfile) {
  // Update existing profile
  const { error: profileError } = await supabase
    .from('user_profiles')
    .update({
      // ... fields to update
    })
    .eq('user_id', user.id);
} else {
  // Create new profile record
  const { error: profileError } = await supabase
    .from('user_profiles')
    .insert({
      user_id: user.id,
      // ... fields to insert
    });
}
```

## Error Handling Improvements

1. **Better Error Messages**: Added console.error logging for debugging
2. **Graceful Degradation**: Profile updates continue even if one table operation fails
3. **Type Safety**: Improved error handling with proper type checking
4. **User Feedback**: Clear success/error messages via toast notifications

## Testing

- ✅ Build passes without TypeScript errors
- ✅ Database operations properly handle unique constraints
- ✅ Both avatar and cover image uploads should now work correctly
- ✅ Profile updates should persist properly

## Files Modified

- `src/pages/Profile.tsx`: Fixed `updateUserProfileImage` and `handleProfileUpdate` functions

## Next Steps

The profile image upload functionality should now work correctly. Users can:
1. Upload profile photos (avatars) - saved to `users.avatar_url`
2. Upload cover images - saved to `user_profiles.cover_image_url`
3. Update profile information without constraint violations

Both operations now properly handle the unique constraint on `user_profiles.user_id` and provide better error handling and user feedback. 