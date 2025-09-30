import { useState } from 'react';

interface UseDialogReturn {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onToggle: () => void;
}

export const useDialog = (initialState = false): UseDialogReturn => {
  const [isOpen, setIsOpen] = useState(initialState);

  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);
  const onToggle = () => setIsOpen(!isOpen);

  return {
    isOpen,
    onOpen,
    onClose,
    onToggle,
  };
};
