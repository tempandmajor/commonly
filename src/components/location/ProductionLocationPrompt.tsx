import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MapPin, Map } from 'lucide-react';
import LocationInput from './LocationInput';

interface LocationPermissionPromptProps {
  isOpen: boolean;
  onProceed: () => void;
  onCancel: () => void;
  onSetManualLocation?: (location: string) => void | undefined;
}

const ProductionLocationPrompt = ({
  isOpen,
  onProceed,
  onCancel,
  onSetManualLocation,
}: LocationPermissionPromptProps) => {
  const [manualLocation, setManualLocation] = React.useState('');
  const [showManualInput, setShowManualInput] = React.useState(false);

  const handleManualLocationSubmit = () => {
    if (manualLocation && onSetManualLocation) {
      onSetManualLocation(manualLocation);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={open => {
        if (!open) {
          onCancel();
        }
      }}
    >
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <MapPin className='h-5 w-5 text-primary' />
            Location Services
          </DialogTitle>
          <DialogDescription>
            Improve your experience by letting us show events and content near you.
          </DialogDescription>
        </DialogHeader>

        <div className='flex items-center justify-center py-4'>
          <div className='bg-primary/10 p-6 rounded-full'>
            <Map className='h-12 w-12 text-primary' />
          </div>
        </div>

        <div className='space-y-2 py-2 text-center'>
          {showManualInput ? (
            <div className='space-y-3'>
              <p className='text-sm text-muted-foreground'>Enter your city or region:</p>
              <LocationInput
                value={manualLocation}
                onChange={setManualLocation}
                placeholder='Enter your location'
                className='w-full'
              />
            </div>
          ) : (
            <p className='text-sm text-muted-foreground'>
              Your privacy is important to us. Your location is only used to show relevant content
              and is never shared.
            </p>
          )}
        </div>

        <DialogFooter className='flex flex-col sm:flex-col gap-2'>
          {showManualInput ? (
            <>
              <Button
                type='button'
                variant='default'
                className='w-full'
                onClick={handleManualLocationSubmit}
                disabled={!manualLocation}
              >
                Set Location
              </Button>
              <Button
                type='button'
                variant='outline'
                className='w-full'
                onClick={() => setShowManualInput(false)}
              >
                Back
              </Button>
            </>
          ) : (
            <>
              <Button type='button' variant='default' className='w-full' onClick={onProceed}>
                Allow Location Access
              </Button>
              <Button
                type='button'
                variant='outline'
                className='w-full'
                onClick={() => setShowManualInput(true)}
              >
                Enter Location Manually
              </Button>
              <Button type='button' variant='ghost' className='w-full' onClick={onCancel}>
                Not now
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProductionLocationPrompt;
