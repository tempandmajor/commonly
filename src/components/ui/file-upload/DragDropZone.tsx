import { Upload } from 'lucide-react';
import { DragEvent } from 'react';

interface DragDropZoneProps {
  isDragging: boolean;
  multiple?: boolean | undefined;
  maxFiles?: number | undefined; // Added this prop
  accept?: string | undefined;
  onDragOver: (e: DragEvent<HTMLDivElement>) => void;
  onDragLeave: (e: DragEvent<HTMLDivElement>) => void;
  onDrop: (e: DragEvent<HTMLDivElement>) => void;
  onClick: () => void;
}

export const DragDropZone = ({
  isDragging,
  multiple,
  maxFiles = 1, // Default to 1 if not provided
  accept,
  onDragOver,
  onDragLeave,
  onDrop,
  onClick,
}: DragDropZoneProps) => {
  return (
    <div
      className={`border-2 border-dashed rounded-lg p-6 text-center ${
        isDragging ? 'border-primary bg-primary/5' : 'border-border'
      } transition-colors cursor-pointer`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={onClick}
    >
      <div className='flex flex-col items-center justify-center space-y-2'>
        <div className='rounded-full bg-primary/10 p-3'>
          <Upload className='h-6 w-6 text-primary' />
        </div>
        <div className='space-y-1'>
          <p className='text-sm font-medium'>Drag & drop or click to select files</p>
          <p className='text-xs text-muted-foreground'>
            {multiple ? `Up to ${maxFiles} files` : 'One file only'}{' '}
            {accept && `(${accept.replace(/,/g, ', ')})`}
          </p>
        </div>
      </div>
    </div>
  );
};
