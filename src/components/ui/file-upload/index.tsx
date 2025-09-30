import { useState } from 'react';
import { useFileUpload } from '@/hooks/useFileUpload';
import { ExistingFiles } from './ExistingFiles';
import { SelectedFiles } from './SelectedFiles';
import { DragDropZone } from './DragDropZone';

interface FileUploadProps {
  onFileSelect: (files: File[]) => void;
  maxFiles?: number | undefined;
  accept?: string | undefined;
  multiple?: boolean | undefined;
  className?: string | undefined;
  existingUrls?: string[] | undefined;
  onRemoveExisting?: (url: string, index: number) => void | undefined;
  maxSizeMB?: number | undefined;
  loading?: boolean | undefined;
  progress?: number | undefined;
}

export const FileUpload = ({
  onFileSelect,
  maxFiles = 1,
  accept,
  multiple = false,
  className = '',
  existingUrls = [],
  onRemoveExisting,
  maxSizeMB = 5,
  loading = false,
  progress = 0,
}: FileUploadProps) => {
  const [existingImages, setExistingImages] = useState<string[]>(existingUrls);

  const {
    isDragging,
    selectedFiles,
    fileInputRef,
    handlers: {
      handleDragOver,
      handleDragLeave,
      handleDrop,
      handleFileInputChange,
      triggerFileInput,
      removeFile,
    },
  } = useFileUpload({ onFileSelect, maxFiles, maxSizeMB });

  const removeExistingImage = (url: string, index: number) => {
    if (onRemoveExisting) {
      onRemoveExisting(url, index);
    } else {
      const newImages = [...existingImages];
      newImages.splice(index, 1);
      setExistingImages(newImages);
    }
  };

  return (
    <div className={className}>
      <input
        type='file'
        ref={fileInputRef}
        className='hidden'
        accept={accept}
        multiple={multiple}
        onChange={handleFileInputChange}
        disabled={loading}
      />

      {loading && progress > 0 ? (
        <div className='w-full bg-gray-200 rounded-full h-2.5 mb-4 dark:bg-gray-700'>
          <div className='bg-primary h-2.5 rounded-full' style={{ width: `${progress}%` }}></div>
          <p className='text-xs text-center mt-1 text-muted-foreground'>
            Uploading: {progress.toFixed(0)}%
          </p>
        </div>
      ) : (
        <DragDropZone
          isDragging={isDragging}
          multiple={multiple}
          maxFiles={maxFiles}
          accept={accept}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={triggerFileInput}
        />
      )}

      <ExistingFiles urls={existingImages} onRemove={removeExistingImage} />

      <SelectedFiles files={selectedFiles} onRemove={removeFile} />
    </div>
  );
};
