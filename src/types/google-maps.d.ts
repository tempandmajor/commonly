
declare global {
  interface Window {
    google: {
      maps: {
        places: {
          AutocompleteService: new () => google.maps.places.AutocompleteService;
          AutocompleteSessionToken: new () => google.maps.places.AutocompleteSessionToken;
          PlacesService: new (attrContainer: HTMLElement) => google.maps.places.PlacesService;
          PlacesServiceStatus: {
            OK: string;
            ZERO_RESULTS: string;
            OVER_QUERY_LIMIT: string;
            REQUEST_DENIED: string;
            INVALID_REQUEST: string;
            UNKNOWN_ERROR: string;
          };
        };
        Geocoder: new () => google.maps.Geocoder;
        Map: new (mapDiv: HTMLElement, opts?: unknown) => google.maps.Map;
        Marker: new (opts?: unknown) => google.maps.Marker;
        InfoWindow: new (opts?: unknown) => google.maps.InfoWindow;
        Animation: {
          DROP: number;
          BOUNCE: number;
        };
      };
    };
  }

  namespace google.maps {
    interface Map {
      setCenter(latLng: LatLng): void;
      setZoom(zoom: number): void;
      addListener(event: string, callback: () => void): unknown;
    }
    
    interface Marker {
      setPosition(latLng: LatLng): void;
      setMap(map: google.maps.Map | null): void;
      addListener(event: string, callback: () => void): unknown;
    }
    
    interface InfoWindow {
      open(map: google.maps.Map, anchor?: google.maps.Marker): void | undefined;
      close(): void;
      setContent(content: string | Element): void;
    }
    
    interface MapOptions {
      center?: LatLng | undefined;
      zoom?: number | undefined;
      mapTypeControl?: boolean | undefined;
      streetViewControl?: boolean | undefined;
      fullscreenControl?: boolean | undefined;
    }
    
    interface MarkerOptions {
      position: LatLng | { lat: number; lng: number };
      map?: google.maps.Map;
      title?: string;
      animation?: number;
    }
    
    interface InfoWindowOptions {
      content?: string | undefined| Element;
      position?: LatLng | undefined;
    }
    
    namespace places {
      interface AutocompleteService {
        getPlacePredictions(
          request: AutocompletionRequest,
          callback: (predictions: AutocompletePrediction[] | null, status: PlacesServiceStatus) => void
        ): void;
      }
      
      interface AutocompletePrediction {
        description: string;
        matched_substrings: {
          length: number;
          offset: number;
        }[];
        place_id: string;
        structured_formatting: {
          main_text: string;
          main_text_matched_substrings: {
            length: number;
            offset: number;
          }[];
          secondary_text: string;
        };
        terms: {
          offset: number;
          value: string;
        }[];
        types: string[];
      }
      
      interface AutocompletionRequest {
        input: string;
        bounds?: LatLngBounds | undefined;
        componentRestrictions?: ComponentRestrictions | undefined;
        location?: LatLng | undefined;
        offset?: number | undefined;
        radius?: number | undefined;
        sessionToken?: AutocompleteSessionToken | undefined;
        types?: string[] | undefined;
      }
      
      interface ComponentRestrictions {
        country: string | string[];
      }
      
      interface AutocompleteSessionToken {}
      
      type PlacesServiceStatus = string;
      
      interface PlacesService {
        getDetails(
          request: PlaceDetailsRequest,
          callback: (result: PlaceResult | null, status: PlacesServiceStatus) => void
        ): void;
      }
      
      interface PlaceDetailsRequest {
        placeId: string;
        fields?: string[] | undefined;
        sessionToken?: AutocompleteSessionToken | undefined;
      }
      
      interface PlaceResult {
        address_components?: {
          long_name: string | undefined;
          short_name: string;
          types: string[];
        }[];
        formatted_address?: string;
        geometry?: {
          location: LatLng;
          viewport?: LatLngBounds;
        };
        name?: string;
        place_id?: string;
      }
    }
    
    interface Geocoder {
      geocode(
        request: { address: string } | { location: LatLng | { lat: number; lng: number } },
        callback: (results: unknown[], status: string) => void
      ): void;
    }
    
    class LatLng {
      constructor(lat: number, lng: number, noWrap?: boolean);
      lat(): number;
      lng(): number;
      toString(): string;
    }
    
    class LatLngBounds {
      constructor(sw?: LatLng, ne?: LatLng);
      contains(latLng: LatLng): boolean;
      equals(other: LatLngBounds): boolean;
      extend(latLng: LatLng): LatLngBounds;
      getCenter(): LatLng;
      getNorthEast(): LatLng;
      getSouthWest(): LatLng;
      intersects(other: LatLngBounds): boolean;
      isEmpty(): boolean;
      toJSON(): { east: number; north: number; south: number; west: number };
      toString(): string;
      toUrlValue(precision?: number): string;
      union(other: LatLngBounds): LatLngBounds;
    }
  }
}

export {};
