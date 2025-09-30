import { File, Image as ImageIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ExistingFilesProps {
  urls: string[];
  onRemove: (url: string, index: number) => void;
}

export const ExistingFiles = ({ urls, onRemove }: ExistingFilesProps) => {
  const isImage = (url: string): boolean => {
    return /\.(jpg|jpeg|png|webp|avif|gif|svg)$/.test(url.toLowerCase());
  };

  if (urls.length === 0) return null;

  return (
    <div className='mt-4 space-y-2'>
      <p className='text-sm font-medium'>Existing Files</p>
      {urls.map((url, index) => (
        <div
          key={`existing-${url}`}
          className='flex items-center justify-between rounded-md border p-2'
        >
          <div className='flex items-center space-x-2'>
            {isImage(url) ? (
              <ImageIcon className='h-4 w-4 text-muted-foreground' />
            ) : (
              <File className='h-4 w-4 text-muted-foreground' />
            )}
            <span className='text-sm font-medium truncate max-w-[250px]'>
              {url.split('/').pop() || `File ${index + 1}`}
            </span>
          </div>
          <Button
            variant='ghost'
            size='icon'
            onClick={e => {
              e.stopPropagation();
              onRemove(url, index);
            }}
          >
            <X className='h-4 w-4' />
          </Button>
        </div>
      ))}
    </div>
  );
};
