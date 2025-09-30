import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

interface GooglePlacesAutocompleteProps {
  placeholder?: string | undefined;
  onPlaceSelect: (place: { description: string; placeId: string }) => void;
  className?: string;
  defaultValue?: string;
  disabled?: boolean;
}

const GooglePlacesAutocomplete = ({
  placeholder = 'Search for a location',
  onPlaceSelect,
  className = '',
  defaultValue = '',
  disabled = false,
}: GooglePlacesAutocompleteProps) => {
  const [inputValue, setInputValue] = useState(defaultValue);
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Initialize Google Maps Autocomplete service
  useEffect(() => {
    // Function to initialize the autocomplete service
    const initService = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        autocompleteService.current = new window.google.maps.places.AutocompleteService();
      } else {
      }
    };

    // If Google Maps API is already loaded
    if (window.google && window.google.maps && window.google.maps.places) {
      initService();
    } else {
      // Load the Google Maps API if not already loaded
      const loadGoogleMapsApi = () => {
        const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY as string;
        if (!googleApiKey) {
          return;
        }

        if (document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]') as HTMLElement) {
          const checkGoogleExists = setInterval(() => {
            if (window.google && window.google.maps && window.google.maps.places) {
              clearInterval(checkGoogleExists);
              initService();
            }
          }, 100);
          return;
        }

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${googleApiKey}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = () => {
          initService();
        };
        script.onerror = () => {};
        document.head.appendChild(script);
      };

      loadGoogleMapsApi();
    }
  }, []);

  // Handle clicks outside the dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = (e.target as HTMLInputElement).value;
    setInputValue(value);

    if (value.length > 1 && autocompleteService.current) {
      setIsLoading(true);
      setShowDropdown(true);

      autocompleteService.current.getPlacePredictions(
        {
          input: value,
          types: ['(cities)'], // Restrict to cities
          componentRestrictions: { country: 'us' }, // Restrict to US
        },
        (predictions, status) => {
          setIsLoading(false);

          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            setPredictions(predictions);
          } else {
            setPredictions([]);
          }
        }
      );
    } else {
      setPredictions([]);
      setShowDropdown(false);
    }
  };

  const handlePredictionClick = (prediction: google.maps.places.AutocompletePrediction) => {
    const place = {
      description: prediction.description,
      placeId: prediction.place_id,
    };

    setInputValue(prediction.description);
    onPlaceSelect(place);
    setShowDropdown(false);
    setPredictions([]);
  };

  const handleInputFocus = () => {
    if (inputValue.length > 1 && predictions.length > 0) {
      setShowDropdown(true);
    }
  };

  return (
    <div className='relative'>
      <Input
        ref={inputRef}
        type='text'
        value={inputValue}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        placeholder={placeholder}
        className={className}
        disabled={disabled}
      />

      {showDropdown && (
        <div
          ref={dropdownRef}
          className='absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto'
        >
          {isLoading ? (
            <div className='flex items-center justify-center p-4'>
              <Loader2 className='h-5 w-5 animate-spin text-primary' />
            </div>
          ) : predictions.length > 0 ? (
            <ul className='py-1'>
              {predictions.map(prediction => (
                <li
                  key={prediction.place_id}
                  className='px-4 py-2 hover:bg-accent cursor-pointer text-sm'
                  onClick={() => handlePredictionClick(prediction)}
                >
                  {prediction.description}
                </li>
              ))}
            </ul>
          ) : (
            inputValue.length > 1 && (
              <div className='p-4 text-center text-muted-foreground text-sm'>
                No locations found
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default GooglePlacesAutocomplete;
