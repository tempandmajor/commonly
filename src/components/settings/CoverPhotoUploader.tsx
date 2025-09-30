import React, { useState } from 'react';
import { User } from '@/types/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, AlertCircle, X } from 'lucide-react';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';
import { uploadMedia } from '@/services/media/uploader';
import { supabase } from '@/integrations/supabase/client';

interface CoverPhotoUploaderProps {
  user: User | null;
  coverImageUrl?: string | undefined;
  onCoverUpdate: (url: string) => void;
}

const CoverPhotoUploader: React.FC<CoverPhotoUploaderProps> = ({
  user,
  coverImageUrl,
  onCoverUpdate
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {

    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file || !user?.id) {
      return;
    }

    setUploadError(null);

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Image size exceeds 10MB limit');
      toast.error('Image size exceeds 10MB limit');
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
      const { url } = await uploadMedia(file, `covers/${user.id}`, progress => {
        setUploadProgress(Math.min(progress, 90));
      });

      const { error: updateError } = await supabase.from('user_profiles').upsert({
        user_id: user.id,
        cover_image_url: url,
        updated_at: new Date().toISOString(),
      });

      if (updateError) {
        throw new Error(updateError.message);
      }

      onCoverUpdate(url);
      setUploadProgress(100);
      toast.success('Cover photo updated successfully');
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to upload cover photo';
      setUploadError(errorMessage);
      toast.error(`Failed to upload cover photo: ${errorMessage}`);
    } finally {
      clearInterval(progressInterval);
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!user?.id) return;

    try {
      const { error } = await supabase.from('user_profiles').upsert({
        user_id: user.id,
        cover_image_url: null,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        throw new Error(error.message);
      }

      onCoverUpdate('');
      toast.success('Cover photo removed');
    } catch (error: any) {
      toast.error('Failed to remove cover photo');
    }
  };

  const triggerFileInput = () => {
    const input = document.getElementById('cover-upload') as HTMLInputElement;
    input?.click();
  };

  const isDisabled = uploading || !user?.id;

  return (
    <Card className='w-full'>
      <CardHeader>
        <CardTitle className='text-lg'>Cover Photo</CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {coverImageUrl ? (
          <div className='relative group'>
            <div className='relative w-full h-48 rounded-lg overflow-hidden bg-muted'>
              <img
                src={coverImageUrl}
                alt='Cover'
                className='w-full h-full object-cover'
                onError={() => {
                  onCoverUpdate('');
                }}
              />
              <div className='absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2'>
                <Button
                  size='sm'
                  variant='secondary'
                  onClick={triggerFileInput}
                  disabled={isDisabled}
                >
                  <Upload className='h-4 w-4 mr-2' />
                  Change
                </Button>
                <Button
                  size='sm'
                  variant='destructive'
                  onClick={handleRemove}
                  disabled={isDisabled}
                >
                  <X className='h-4 w-4 mr-2' />
                  Remove
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div
            className='w-full h-48 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors'
            onClick={triggerFileInput}
          >
            <div className='text-center'>
              <Upload className='h-8 w-8 mx-auto mb-2 text-muted-foreground' />
              <p className='text-sm text-muted-foreground'>Click to upload cover photo</p>
              <p className='text-xs text-muted-foreground mt-1'>
                Recommended: 1200x400px, max 10MB
              </p>
            </div>
          </div>
        )}

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

        <input
          id='cover-upload'
          type='file'
          accept='image/*'
          className='hidden'
          onChange={handleFileChange}
          disabled={isDisabled}
        />
      </CardContent>
    </Card>
  );
};

export default CoverPhotoUploader;