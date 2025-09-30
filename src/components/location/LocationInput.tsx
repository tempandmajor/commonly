import GooglePlacesAutocomplete from './GooglePlacesAutocomplete';

interface LocationInputProps {
  value?: string | undefined;
  onChange: (value: string) => void;
  placeholder?: string | undefined;
  className?: string | undefined;
  disabled?: boolean | undefined;
}

const LocationInput = ({
  value = '',
  onChange,
  placeholder = 'Enter location',
  className,
  disabled,
}: LocationInputProps) => {
  const handlePlaceSelected = (place: { description: string; placeId: string }) => {
    onChange(place.description);
  };

  return (
    <GooglePlacesAutocomplete
      defaultValue={value}
      onPlaceSelect={handlePlaceSelected}
      placeholder={placeholder}
      className={className}
      disabled={disabled}
    />
  );
};

export default LocationInput;
