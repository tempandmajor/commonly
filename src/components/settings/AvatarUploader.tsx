import React, { useState, useEffect } from 'react';
import { User } from '@/types/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Upload, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';
import { uploadMedia } from '@/services/media/uploader';
import { supabase } from '@/integrations/supabase/client';

interface AvatarUploaderProps {
  user: User | null;
  onAvatarUpdate: (url: string) => void;
}

const AvatarUploader = ({ user, onAvatarUpdate }: AvatarUploaderProps) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(
    user?.profilePicture || user?.avatar
  );

  useEffect(() => {
    const profileImage = user?.profilePicture || user?.avatar;
    if (profileImage) {
      setAvatarUrl(profileImage);
    }
  }, [user?.profilePicture, user?.avatar]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {

    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file || !user?.id) {
      return;
    }

    setUploadError(null);

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image size exceeds 5MB limit');
      toast.error('Image size exceeds 5MB limit');
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
      setUploadError('Please upload an image file (JPEG, PNG, GIF, or WebP)');
      toast.error('Please upload an image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 10;
      });
    }, 300);

    try {
      // Upload the file using the media uploader
      const { url } = await uploadMedia(file, `avatars/${user.id}`, progress => {
        setUploadProgress(Math.min(progress, 90));
      });

      // Update the user's avatar_url in the database
      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: url })
        .eq('id', user.id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      // Update local state
      setAvatarUrl(url);
      onAvatarUpdate(url);

      setUploadProgress(100);
      toast.success('Profile picture updated successfully');
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to upload profile picture';
      setUploadError(errorMessage);
      toast.error(`Failed to upload profile picture: ${errorMessage}`);
    } finally {
      clearInterval(progressInterval);
      setUploading(false);
    }
  };

  const userInitials = user?.name
    ? user.name
        .split(' ')
        .map(part => part[0])
        .join('')
        .toUpperCase()
    : user?.email?.charAt(0).toUpperCase() || '?';

  const isDisabled = uploading || !user?.id;

  return (
    <Card className='w-full max-w-xs'>
      <CardContent className='p-6 flex flex-col items-center space-y-4'>
        <Avatar className='h-24 w-24'>
          <AvatarImage src={avatarUrl} alt={user?.name || 'User'} />
          <AvatarFallback className='text-xl'>{userInitials}</AvatarFallback>
        </Avatar>

        {uploadError && (
          <div className='flex items-center gap-2 text-sm text-destructive'>
            <AlertCircle className='h-4 w-4' />
            <span>{uploadError}</span>
          </div>
        )}

        {uploading && (
          <div className='w-full space-y-1'>
            <Progress value={uploadProgress} className='h-2' />
            <p className='text-xs text-center text-muted-foreground'>{uploadProgress}% uploaded</p>
          </div>
        )}

        <Button
          variant='outline'
          disabled={isDisabled}
          className='w-full relative'
          onClick={() => (document.getElementById('avatar-upload') as HTMLInputElement)?.click()}
        >
          {uploading ? (
            <>
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              Uploading...
            </>
          ) : (
            <>
              <Upload className='mr-2 h-4 w-4' />
              Change Avatar
            </>
          )}
          <input
            id='avatar-upload'
            type='file'
            accept='image/*'
            className='hidden'
            onChange={handleFileChange}
            disabled={isDisabled}
          />
        </Button>

        <p className='text-xs text-muted-foreground text-center'>
          Recommended: Square image, max 5MB, JPG/PNG/GIF
        </p>
      </CardContent>
    </Card>
  );
};

export default AvatarUploader;
