import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  useAvatarUpload,
  useEventImageUpload,
  useListFiles,
  StorageBucket,
} from '@/services/storage';

/**
 * Example component demonstrating the use of the consolidated Storage Service hooks
 *
 * This component serves as a reference implementation showing how to use the
 * various Storage Service hooks in React components.
 */
const StorageUploadExample: React.FC<{ eventId?: string }> = ({ eventId = 'example-event' }) => {
  // Avatar upload example
  const {
    file: avatarFile,
    progress: avatarProgress,
    isUploading: isUploadingAvatar,
    handleFileChange: handleAvatarChange,
    upload: uploadAvatar,
  } = useAvatarUpload({
    onSuccess: () => {
      // Avatar upload successful
    },
  });

  // Event image upload example
  const {
    file: eventImageFile,
    progress: eventImageProgress,
    isUploading: isUploadingEventImage,
    handleFileChange: handleEventImageChange,
    upload: uploadEventImage,
  } = useEventImageUpload(eventId, {
    onSuccess: () => {
      // Event image upload successful
    },
  });

  // List files example
  const {
    data: avatarFiles,
    isLoading: isLoadingAvatars,
    refetch: refetchAvatars,
  } = useListFiles(StorageBucket.AVATARS, {
    limit: 5,
    sortBy: {
      column: 'created_at',
      order: 'desc',
    },
  });

  return (
    <div className='space-y-8 p-4'>
      <Card>
        <CardHeader>
          <CardTitle>Upload Avatar</CardTitle>
          <CardDescription>Example of using useAvatarUpload hook</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            <input
              type='file'
              accept='image/*'
              onChange={handleAvatarChange}
              disabled={isUploadingAvatar}
              className='block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/80'
            />
            {avatarFile && (
              <div className='text-sm text-muted-foreground'>Selected: {avatarFile.name}</div>
            )}
            {isUploadingAvatar && (
              <div className='space-y-2'>
                <Progress value={avatarProgress.progress} />
                <p className='text-sm text-muted-foreground'>
                  Uploading... {Math.round(avatarProgress.progress)}%
                </p>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={() => avatarFile && uploadAvatar(avatarFile)}
            disabled={!avatarFile || isUploadingAvatar}
          >
            Upload Avatar
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Upload Event Image</CardTitle>
          <CardDescription>Example of using useEventImageUpload hook</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            <input
              type='file'
              accept='image/*'
              onChange={handleEventImageChange}
              disabled={isUploadingEventImage}
              className='block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/80'
            />
            {eventImageFile && (
              <div className='text-sm text-muted-foreground'>Selected: {eventImageFile.name}</div>
            )}
            {isUploadingEventImage && (
              <div className='space-y-2'>
                <Progress value={eventImageProgress.progress} />
                <p className='text-sm text-muted-foreground'>
                  Uploading... {Math.round(eventImageProgress.progress)}%
                </p>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className='flex flex-col items-start space-y-2'>
          <div className='flex space-x-2'>
            <Button
              onClick={() => eventImageFile && uploadEventImage(eventImageFile, 'banner')}
              disabled={!eventImageFile || isUploadingEventImage}
            >
              Upload as Banner
            </Button>
            <Button
              onClick={() => eventImageFile && uploadEventImage(eventImageFile, 'thumbnail')}
              disabled={!eventImageFile || isUploadingEventImage}
              variant='outline'
            >
              Upload as Thumbnail
            </Button>
          </div>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Avatars</CardTitle>
          <CardDescription>Example of using useListFiles hook</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingAvatars ? (
            <p>Loading files...</p>
          ) : avatarFiles && avatarFiles.length > 0 ? (
            <ul className='space-y-2'>
              {avatarFiles.map((file, index) => (
                <li key={index} className='flex items-center space-x-2'>
                  <img
                    src={file.name}
                    alt={file.name}
                    className='h-10 w-10 rounded-full object-cover'
                  />
                  <div className='overflow-hidden'>
                    <p className='truncate text-sm font-medium'>{file.name}</p>
                    <p className='text-xs text-muted-foreground'>
                      {new Date(file.updated_at || Date.now()).toLocaleDateString()} •{' '}
                      {((file.size || 0) / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p>No files found</p>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={() => refetchAvatars()} variant='outline'>
            Refresh List
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default StorageUploadExample;
