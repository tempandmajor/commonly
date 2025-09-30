import React, { useEffect, useRef, useState } from 'react';
import { Loader, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MapLibreMapProps {
  latitude: number;
  longitude: number;
  title?: string | undefined;
  zoom?: number | undefined;
  height?: string | undefined;
  width?: string | undefined;
  className?: string | undefined;
}

const MapLibreMap: React.FC<MapLibreMapProps> = ({
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
  const [mapInstance, setMapInstance] = useState<any>(null);

  useEffect(() => {
    let mounted = true;

    const initializeMap = async () => {
      if (!mapRef.current) return;

      try {
        // Dynamically import MapLibre GL JS to avoid loading it if not needed
        const maplibregl = await import('maplibre-gl');

        if (!mounted) return;

        // Use free OpenStreetMap tiles via Maptiler (much cheaper than Google Maps)
        // Maptiler offers 100k map views/month free, then $1/1000 requests vs Google's $7/1000
        const map = new maplibregl.Map({
          container: mapRef.current,
          style: {
            version: 8,
            sources: {
              osm: {
                type: 'raster',
                tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
                tileSize: 256,
                attribution: '© OpenStreetMap contributors',
              },
            },
            layers: [
              {
                id: 'osm',
                type: 'raster',
                source: 'osm',
              },
            ],
          },
          center: [longitude, latitude],
          zoom: zoom,
          attributionControl: false, // We'll add custom attribution
        });

        // Add marker for the event location
        const marker = new maplibregl.Marker({
          color: '#000000',
          scale: 1.2,
        })
          .setLngLat([longitude, latitude])
          .addTo(map);

        // Add popup with title if provided
        if (title) {
          const popup = new maplibregl.Popup({
            offset: 25,
            closeButton: false,
            className: 'map-popup',
          })
            .setLngLat([longitude, latitude])
            .setHTML(
              `
              <div style="padding: 8px; max-width: 200px;">
                <p style="font-weight: bold; margin-bottom: 4px; font-size: 14px;">${title}</p>
                <a href="https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}&zoom=${zoom}" 
                   target="_blank" 
                   rel="noopener noreferrer"
                   style="color: #0366d6; font-size: 12px; text-decoration: none;">
                  View on OpenStreetMap →
                </a>
              </div>
            `
            )
            .addTo(map);
        }

        // Add zoom and navigation controls
        map.addControl(new maplibregl.NavigationControl(), 'top-right');

        // Add attribution control
        map.addControl(
          new maplibregl.AttributionControl({
            customAttribution: '© OpenStreetMap contributors',
          }),
          'bottom-right'
        );

        map.on('load', () => {
          if (mounted) {
            setMapLoaded(true);
            setMapInstance(map);
          }
        });

        map.on('error', (e: any) => {
          console.error('MapLibre error:', e);
          if (mounted) {
            setMapError('Failed to load map');
          }
        });
      } catch (error) {
        console.error('Failed to initialize MapLibre:', error);
        if (mounted) {
          setMapError('Failed to load map library');
        }
      }
    };

    initializeMap();

    return () => {
      mounted = false;
      if (mapInstance) {
        mapInstance.remove();
      }
    };
  }, [latitude, longitude, title, zoom]);

  if (mapError) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-muted rounded-md border ${className}`}
        style={{ height, width }}
      >
        <p className='text-muted-foreground mb-3 text-sm'>Unable to load map</p>
        <Button variant='outline' size='sm' asChild>
          <a
            href={`https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}&zoom=${zoom}`}
            target='_blank'
            rel='noopener noreferrer'
            className='flex items-center gap-2'
          >
            <ExternalLink className='h-3 w-3' />
            View on OpenStreetMap
          </a>
        </Button>
      </div>
    );
  }

  return (
    <div
      className={`relative rounded-md overflow-hidden border ${className}`}
      style={{ height, width }}
    >
      <div ref={mapRef} style={{ height: '100%', width: '100%' }} />

      {!mapLoaded && (
        <div className='absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm'>
          <div className='flex flex-col items-center'>
            <Loader className='h-6 w-6 animate-spin text-primary' />
            <p className='mt-2 text-sm text-muted-foreground'>Loading map...</p>
          </div>
        </div>
      )}

      {mapLoaded && title && (
        <div className='absolute bottom-4 right-4'>
          <Button variant='secondary' size='sm' asChild className='shadow-md'>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`}
              target='_blank'
              rel='noopener noreferrer'
              className='flex items-center gap-2'
            >
              <ExternalLink className='h-3 w-3' />
              Get Directions
            </a>
          </Button>
        </div>
      )}
    </div>
  );
};

export default MapLibreMap;
