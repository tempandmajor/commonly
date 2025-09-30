import { File, Image as ImageIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SelectedFilesProps {
  files: File[];
  onRemove: (index: number) => void;
}

export const SelectedFiles = ({ files, onRemove }: SelectedFilesProps) => {
  if (files.length === 0) return null;

  return (
    <div className='mt-4 space-y-2'>
      <p className='text-sm font-medium'>Selected Files</p>
      {files.map((file, index) => (
        <div
          key={`${file.name}-${index}`}
          className='flex items-center justify-between rounded-md border p-2'
        >
          <div className='flex items-center space-x-2'>
            {file.type.startsWith('image/') ? (
              <ImageIcon className='h-4 w-4 text-muted-foreground' />
            ) : (
              <File className='h-4 w-4 text-muted-foreground' />
            )}
            <span className='text-sm font-medium truncate max-w-[250px]'>{file.name}</span>
            <span className='text-xs text-muted-foreground'>
              {(file.size / (1024 * 1024)).toFixed(2)} MB
            </span>
          </div>
          <Button
            variant='ghost'
            size='icon'
            onClick={e => {
              e.stopPropagation();
              onRemove(index);
            }}
          >
            <X className='h-4 w-4' />
          </Button>
        </div>
      ))}
    </div>
  );
};
