import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { toast } from 'sonner';

interface UseFileUploadProps {
  onFileSelect: (files: File[]) => void;
  maxFiles?: number | undefined;
  maxSizeMB?: number | undefined;
}

export const useFileUpload = ({
  onFileSelect,
  maxFiles = 1,
  maxSizeMB = 5,
}: UseFileUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFiles = (files: File[]) => {
    // Validate file size
    const validFiles = files.filter(file => {
      if (file.size > maxSizeMB * 1024 * 1024) {
        toast.error(`File ${file.name} is too large. Maximum size is ${maxSizeMB}MB.`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    // Limit number of files
    const filesToAdd = validFiles.slice(0, maxFiles);
    setSelectedFiles(filesToAdd);
    onFileSelect(filesToAdd);
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if ((e.target as HTMLInputElement).files && (e.target as HTMLInputElement).files.length > 0) {
      handleFiles(Array.from((e.target as HTMLInputElement).files));
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const removeFile = (index: number) => {
    const newFiles = [...selectedFiles];
    newFiles.splice(index, 1);
    setSelectedFiles(newFiles);
    onFileSelect(newFiles);
  };

  return {
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
  };
};
