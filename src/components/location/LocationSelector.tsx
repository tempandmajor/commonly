import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, ChevronDown, Loader2, MapPin, RotateCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import LocationInput from '@/components/location/LocationInput';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';

interface LocationSelectorProps {
  currentLocation?: string | undefined| null;
  isLoading?: boolean | undefined;
  error?: string | undefined| null;
  onRefresh?: () => void | undefined;
  onSelect?: (location: string) => void | undefined;
  className?: string | undefined;
}

const LocationSelector = ({
  currentLocation = null,
  isLoading = false,
  error = null,
  onRefresh = () => {},
  onSelect = () => {},
  className,
}: LocationSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [manualInputOpen, setManualInputOpen] = useState(false);

  const popularLocations = [
    'New York, NY',
    'Los Angeles, CA',
    'Chicago, IL',
    'Houston, TX',
    'Phoenix, AZ',
  ];

  // Clean up location display if it looks like coordinates
  const displayLocation = currentLocation
    ? currentLocation.includes('.') && currentLocation.includes(',') && /\d/.test(currentLocation)
      ? 'Location detected'
      : currentLocation
    : 'Select location';

  const handleManualInputClose = () => {
    setManualInputOpen(false);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          role='combobox'
          aria-expanded={open}
          className={cn('flex items-center justify-between gap-2 w-[180px]', className)}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className='h-4 w-4 animate-spin' />
          ) : (
            <MapPin className='h-4 w-4 shrink-0' />
          )}
          <span className='truncate flex-1 text-left'>{displayLocation}</span>
          <ChevronDown className='h-4 w-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-[300px] p-0' align='start'>
        {manualInputOpen ? (
          <div className='p-4 space-y-4'>
            <h3 className='font-medium text-sm'>Enter location</h3>
            <LocationInput
              value={currentLocation || ''}
              onChange={value => {
                onSelect(value);
                handleManualInputClose();
              }}
              placeholder='Enter city name'
              className='w-full'
            />
            <div className='flex justify-between'>
              <Button variant='outline' size='sm' onClick={() => setManualInputOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Command>
            <CommandList>
              <CommandGroup heading='Your location'>
                <CommandItem
                  onSelect={() => {
                    onRefresh();
                    setOpen(false);
                  }}
                  className='flex items-center gap-2'
                >
                  <div className='flex items-center gap-2 flex-1'>
                    <RotateCw className='h-4 w-4' />
                    <span>Get current location</span>
                  </div>
                </CommandItem>
                <CommandItem
                  onSelect={() => {
                    onSelect('All locations');
                    setOpen(false);
                  }}
                  className='flex items-center gap-2'
                >
                  <div className='flex items-center gap-2 flex-1'>
                    <Check
                      className={cn(
                        'h-4 w-4',
                        currentLocation === 'All locations' || !currentLocation
                          ? 'opacity-100'
                          : 'opacity-0'
                      )}
                    />
                    <span>All locations</span>
                  </div>
                </CommandItem>
              </CommandGroup>
              <CommandGroup heading='Popular locations'>
                {popularLocations.map(location => (
                  <CommandItem
                    key={location}
                    onSelect={() => {
                      onSelect(location);
                      setOpen(false);
                    }}
                    className='flex items-center gap-2'
                  >
                    <div className='flex items-center gap-2 flex-1'>
                      <Check
                        className={cn(
                          'h-4 w-4',
                          currentLocation === location ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <span>{location}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
            <div className='p-2 border-t'>
              <Button
                variant='outline'
                size='sm'
                className='w-full justify-center'
                onClick={() => setManualInputOpen(true)}
              >
                Enter custom location
              </Button>
            </div>
          </Command>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default LocationSelector;
