/**
 * @file Storage operations for user files and avatars
 */

import { supabase, storageBuckets } from '../core/client';
import { handleUserError } from '../core/errors';
import { updateUserAvatar } from './profile';

/**
 * Upload a profile image for a user
 * @param userId User ID
 * @param file Image file to upload
 * @returns Public URL of the uploaded image or null on failure
 */
export async function uploadProfileImage(userId: string, file: File): Promise<string | null> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/profile.${fileExt}`;
    const filePath = `profiles/${fileName}`;

    const { data, error } = await supabase.storage
      .from(storageBuckets.avatars())
      .upload(filePath, file, {
        upsert: true,
      });

    if (error) throw error;

    const {
      data: { publicUrl },
    } = supabase.storage.from(storageBuckets.avatars()).getPublicUrl(filePath);

    // Update user avatar URL in profile
    await updateUserAvatar(userId, publicUrl);

    return publicUrl;
  } catch (error) {
    handleUserError(error, 'Error uploading profile image');
    return null;
  }
}

/**
 * Upload a file to user's storage space
 * @param userId User ID
 * @param file File to upload
 * @param path Optional path within user's storage
 * @returns Public URL of the uploaded file or null on failure
 */
export async function uploadUserFile(
  userId: string,
  file: File,
  path = 'general'
): Promise<string | null> {
  try {
    const fileName = `${userId}/${path}/${file.name}`;

    const { data, error } = await supabase.storage
      .from(storageBuckets.uploads())
      .upload(fileName, file, {
        upsert: false,
      });

    if (error) throw error;

    const {
      data: { publicUrl },
    } = supabase.storage.from(storageBuckets.uploads()).getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    handleUserError(error, 'Error uploading file');
    return null;
  }
}

/**
 * Delete a file from user's storage
 * @param userId User ID
 * @param filePath Path to the file
 * @returns Success status
 */
export async function deleteUserFile(userId: string, filePath: string): Promise<boolean> {
  try {
    // Ensure the file belongs to this user
    if (!filePath.includes(`${userId}/`)) {
      return false;
    }

    const { error } = await supabase.storage.from(storageBuckets.uploads()).remove([filePath]);

    if (error) throw error;

    return true;
  } catch (error) {
    handleUserError(error, 'Error deleting file');
    return false;
  }
}

/**
 * List files in user's storage
 * @param userId User ID
 * @param path Optional path within user's storage
 * @returns Array of files or empty array on failure
 */
export async function listUserFiles(userId: string, path = 'general'): Promise<any[]> {
  try {
    const { data, error } = await supabase.storage
      .from(storageBuckets.uploads())
      .list(`${userId}/${path}`);

    if (error) throw error;

    return data || [];
  } catch (error) {
    handleUserError(error, 'Error listing files');
    return [];
  }
}

/**
 * Get a signed URL for a file with temporary access
 * @param bucket Storage bucket
 * @param filePath Path to file
 * @param expiresIn Expiration time in seconds (default 60 minutes)
 * @returns Signed URL or null on failure
 */
export async function getSignedUrl(
  bucket: string,
  filePath: string,
  expiresIn = 3600
): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, expiresIn);

    if (error) throw error;

    return data.signedUrl;
  } catch (error) {
    handleUserError(error, 'Error creating signed URL');
    return null;
  }
}
