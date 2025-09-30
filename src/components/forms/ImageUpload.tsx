import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuth } from '@/providers/AuthProvider';
import { useUpload, useDeleteFile } from '@/services/storage';
import { StorageBucket } from '@/services/storage';

interface ImageUploadProps {
  value?: string | undefined;
  onChange: (url: string) => void;
  className?: string | undefined;
  accept?: string | undefined;
  maxSizeMB?: number | undefined;
  placeholder?: string | undefined;
  bucket?: string | undefined;
  path?: string | undefined;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  className,
  accept = 'image/*',
  maxSizeMB = 10,
  placeholder = 'Click to upload image',
  bucket = 'avatars',
  path = 'uploads',
}) => {
  const auth = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const storageBucket = bucket as StorageBucket;

  // Use the consolidated storage hooks
  const {
    file: selectedFile,
    progress,
    isUploading,
    upload,
    handleFileChange,
    reset: resetFile,
  } = useUpload({
    onSuccess: result => {
      onChange(result.url);
    },
    onError: error => {
      // Toast is already handled in the hook
    },
  });

  const { mutate: deleteFile, isPending: isDeleting } = useDeleteFile({
    onSuccess: () => {
      onChange('');
    },
  });

  // Custom file change handler to validate before using the hook's handler
  const handleCustomFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {

    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`File size must be less than ${maxSizeMB}MB`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      toast.error('Please upload a valid image file (JPEG, PNG, GIF, or WebP)');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Pass to the hook's handler if validation passes
    handleFileChange(e);
  };

  // Function to upload the file
  const uploadFile = async () => {
    if (!selectedFile || !auth) return;

    // Create a unique filename
    const fileExt = selectedFile.name.split('.').pop() || 'jpg';
    const fileName = `${path}/${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;

    await upload({
      bucket: storageBucket,
      path: fileName,
      file: selectedFile,
      options: {
        cacheControl: '3600',
        upsert: true,
      },
    });

    // Reset the input so the same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = '';
    resetFile();
  };

  // Function to remove the file
  const handleRemove = () => {
    if (value) {
      deleteFile(value);
    } else {
      onChange('');
    }
  };

  return (
    <div className={cn('relative', className)}>
      {value ? (
        <div className='relative group'>
          <img
            src={value}
            alt='Uploaded'
            className='w-full h-full object-cover rounded-lg'
            onError={e => {
              // Fallback to remove broken image
              onChange('');
            }}
          />
          <div className='absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center'>
            <Button
              type='button'
              variant='destructive'
              size='icon'
              onClick={handleRemove}
              className='h-8 w-8'
              disabled={isUploading || isDeleting}
            >
              <X className='h-4 w-4' />
            </Button>
          </div>
        </div>
      ) : (
        <Card
          className={cn(
            'border-2 border-dashed cursor-pointer hover:bg-muted/50 transition-colors',
            'flex items-center justify-center',
            isUploading && 'opacity-50 cursor-not-allowed',
            className
          )}
        >
          <label
            className={cn(
              'cursor-pointer w-full h-full flex flex-col items-center justify-center p-6',
              isUploading && 'cursor-not-allowed'
            )}
          >
            <input
              ref={fileInputRef}
              type='file'
              accept={accept}
              onChange={handleCustomFileChange}
              disabled={isUploading || isDeleting}
              className='hidden'
            />
            {isUploading ? (
              <>
                <Loader2 className='h-8 w-8 text-muted-foreground mb-2 animate-spin' />
                <span className='text-sm text-muted-foreground'>

                  Uploading...{progress.progress > 0 ? ` ${Math.round(progress.progress)}%` : ''}
                </span>
              </>
            ) : selectedFile ? (
              <>
                <Upload className='h-8 w-8 text-muted-foreground mb-2' />
                <span className='text-sm text-muted-foreground text-center'>
                  {selectedFile.name}
                </span>
                <Button
                  type='button'
                  onClick={uploadFile}
                  className='mt-2'
                  disabled={!selectedFile}
                >
                  Upload
                </Button>
              </>
            ) : (
              <>
                <Upload className='h-8 w-8 text-muted-foreground mb-2' />
                <span className='text-sm text-muted-foreground text-center'>{placeholder}</span>
                <span className='text-xs text-muted-foreground mt-1'>
                  Max {maxSizeMB}MB • JPEG, PNG, GIF, WebP
                </span>
              </>
            )}
          </label>
        </Card>
      )}
    </div>
  );
};

export default ImageUpload;

