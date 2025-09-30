import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MapPin } from 'lucide-react';

interface LocationPermissionPromptProps {
  isOpen: boolean;
  onProceed: () => void;
  onCancel: () => void;
}

const LocationPermissionPrompt = ({
  isOpen,
  onProceed,
  onCancel,
}: LocationPermissionPromptProps) => {
  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className='flex items-center gap-2'>
            <MapPin className='h-5 w-5 text-primary' />
            Location Access
          </AlertDialogTitle>
          <AlertDialogDescription>
            The Commonly app would like to use your current location to show you nearby events and
            provide a better experience.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Not now</AlertDialogCancel>
          <AlertDialogAction onClick={onProceed}>Allow</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default LocationPermissionPrompt;
