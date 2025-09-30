import React, { useEffect, useRef, useState } from 'react';
import { Loader } from 'lucide-react';

interface GoogleMapProps {
  latitude: number;
  longitude: number;
  title?: string | undefined;
  zoom?: number | undefined;
  height?: string | undefined;
  width?: string | undefined;
  className?: string | undefined;
}

const GoogleMap: React.FC<GoogleMapProps> = ({
  latitude,
  longitude,
  title,
  zoom = 15,
  height = '300px',
  width = '100%',
  className = '',
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    // Check if Google Maps API is already loaded
    if (!window.google || !window.google.maps) {
      const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY as string;

      if (!googleMapsApiKey) {
        setMapError('Google Maps API key not found');
        return;
      }

      // Create the script element to load the Google Maps API
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places`;
      script.async = true;
      script.defer = true;

      script.onload = () => initializeMap();
      script.onerror = () => setMapError('Failed to load Google Maps');

      document.head.appendChild(script);

      return () => {
        // Clean up script tag if component unmounts during loading
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      };
    } else {
      // Google Maps API is already loaded
      initializeMap();
    }
  }, [latitude, longitude]);

  const initializeMap = () => {
    if (!mapRef.current) return;

    try {
      const mapOptions = {
        center: { lat: latitude, lng: longitude },
        zoom: zoom,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
      };

      const map = new window.google.maps.Map(mapRef.current, mapOptions);

      // Add marker for the event location
      const marker = new window.google.maps.Marker({
        position: { lat: latitude, lng: longitude },
        map: map,
        title: title || 'Event Location',
        animation: window.google.maps.Animation.DROP,
      });

      // Add info window if title is provided
      if (title) {
        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 8px; max-width: 200px;">
              <p style="font-weight: bold; margin-bottom: 4px;">${title}</p>
              <a href="https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}" 
                 target="_blank" style="color: #0366d6;">Get Directions</a>
            </div>
          `,
        });

        marker.addListener('click', () => {
          infoWindow.open(map, marker);
        });

        // Auto-open info window on load
        infoWindow.open(map, marker);
      }

      setMapLoaded(true);
    } catch (error) {
      setMapError('Failed to initialize Google Maps');
    }
  };

  if (mapError) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-muted rounded-md ${className}`}
        style={{ height, width }}
      >
        <p className='text-muted-foreground mb-2'>Unable to load map</p>
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`}
          target='_blank'
          rel='noopener noreferrer'
          className='text-primary hover:underline'
        >
          View location on Google Maps
        </a>
      </div>
    );
  }

  return (
    <div className={`relative rounded-md overflow-hidden ${className}`} style={{ height, width }}>
      <div ref={mapRef} style={{ height: '100%', width: '100%' }} />

      {!mapLoaded && (
        <div className='absolute inset-0 flex items-center justify-center bg-muted bg-opacity-70'>
          <div className='flex flex-col items-center'>
            <Loader className='h-8 w-8 animate-spin text-primary' />
            <p className='mt-2 text-sm'>Loading map...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleMap;
