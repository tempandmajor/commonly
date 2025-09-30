import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Search, MapPin, Users, Star, Building, X, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface VenueLocation {
  address?: string | undefined;
  city?: string | undefined;
  state?: string | undefined;
  country?: string | undefined;
}

interface VenueMetadata {
  rating?: number | undefined;
  price_range?: string | undefined;
  venue_type?: string | undefined;
  image_url?: string | undefined;
  website?: string | undefined;
  phone?: string | undefined;
}

interface Venue {
  id: string;
  name: string;
  description?: string | undefined;
  capacity?: number | undefined;
  amenities?: string[] | undefined;
  status?: string | undefined;
  metadata?: VenueMetadata | undefined;
  featured?: boolean | undefined;
  locations?: VenueLocation | undefined;
  address: string;
  city: string;
  state: string;
  rating?: number | undefined;
  price_range?: string | undefined;
  venue_type?: string | undefined;
  image_url?: string | undefined;
}

interface VenueSearchSelectProps {
  value?: string | undefined;
  onSelect: (venue: Venue) => void;
  placeholder?: string | undefined;
  className?: string | undefined;
  disabled?: boolean | undefined;
  required?: boolean | undefined;
  error?: string | undefined;
  showSelectedDetails?: boolean | undefined;
}

interface VenueSearchResult {
  id: string;
  name: string;
  description?: string | undefined;
  capacity?: number | undefined;
  amenities?: string[] | undefined;
  metadata?: any | undefined;
  featured?: boolean | undefined;
  locations?: any | undefined;
}

const VenueSearchSelect: React.FC<VenueSearchSelectProps> = ({
  value,
  onSelect,
  placeholder = 'Search for venues...',
  className,
  disabled = false,
  required = false,
  error,
  showSelectedDetails = true,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [venues, setVenues] = useState<Venue[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const transformVenueData = useCallback((venueData: VenueSearchResult): Venue => {
    const metadata = (venueData.metadata as VenueMetadata) || {};
    const location = venueData.locations as VenueLocation;

    return {
      id: venueData.id,
      name: venueData.name,
      description: venueData.description || '',
      capacity: venueData.capacity || 0,
      amenities: Array.isArray(venueData.amenities)
        ? venueData.amenities.filter(Boolean)
        : [],
      address: location?.address || '',
      city: location?.city || '',
      state: location?.state || '',
      rating: metadata.rating || 0,
      price_range: metadata.price_range || '$',
      venue_type: metadata.venue_type || 'Event Space',
      image_url: metadata.image_url || '',
      featured: venueData.featured || false,
      status: 'active',
      metadata,
      locations: location,
    };
  }, []);

  const searchVenues = useCallback(async (query: string) => {
    if (query.length < 2) {
      setVenues([]);
      setShowResults(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('venues')
        .select(`
          id,
          name,
          description,
          capacity,
          amenities,
          status,
          metadata,
          featured,
          locations:location_id (
            address,
            city,
            state,
            country
          )
        `)
        .eq('status', 'active')
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
        .order('featured', { ascending: false })
        .order('name', { ascending: true })
        .limit(10);

      if (error) {
        console.error('Error searching venues:', error);
        setVenues([]);
        return;
      }

      const transformedVenues = (data || []).map(transformVenueData);
      setVenues(transformedVenues);
      setShowResults(true);
    } catch (error) {
      console.error('Error searching venues:', error);
      setVenues([]);
    } finally {
      setIsLoading(false);
    }

  }, [transformVenueData]);

  const loadVenueById = useCallback(async (venueId: string) => {
    try {
      const { data, error } = await supabase
        .from('venues')
        .select(`
          id,
          name,
          description,
          capacity,
          amenities,
          metadata,
          featured,
          locations:location_id (
            address,
            city,
            state,
            country
          )
        `)
        .eq('id', venueId)
        .single();

      if (error) {
        console.error('Error loading venue:', error);
        return;
      }

      if (data) {
        const venue = transformVenueData(data);
        setSelectedVenue(venue);
      }
    } catch (error) {
      console.error('Error loading venue:', error);
    }

  }, [transformVenueData]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      searchVenues(searchQuery);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, searchVenues]);

  useEffect(() => {
    if (value && !selectedVenue) {
      loadVenueById(value);
    } else if (value && venues.length > 0) {
      const venue = venues.find(v => v.id === value);
      if (venue) {
        setSelectedVenue(venue);
      }
    } else if (!value) {
      setSelectedVenue(null);
    }
  }, [value, venues, selectedVenue, loadVenueById]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleVenueSelect = useCallback((venue: Venue) => {
    setSelectedVenue(venue);
    setSearchQuery('');
    setShowResults(false);
    setIsOpen(false);
    onSelect(venue);
  }, [onSelect]);

  const handleClearSelection = useCallback(() => {
    setSelectedVenue(null);
    setSearchQuery('');
    setShowResults(false);
    onSelect(null as any); // Clear selection
  }, [onSelect]);

  const handleInputFocus = useCallback(() => {
    setIsOpen(true);
    if (venues.length > 0) {
      setShowResults(true);
    }
  }, [venues.length]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const query = (e.target as HTMLInputElement).value;
    setSearchQuery(query);
    setIsOpen(true);
  }, []);

  const formatAddress = useCallback((venue: Venue) => {
    const parts = [venue.address, venue.city, venue.state].filter(Boolean);
    return parts.join(', ');
  }, []);

  const renderVenueItem = useCallback((venue: Venue) => (
    <Card
      key={venue.id}
      className="cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.01] border-l-4 border-l-transparent hover:border-l-primary"
      onClick={() => handleVenueSelect(venue)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {venue.image_url ? (
            <img
              src={venue.image_url}
              alt={venue.name}
              className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
            />
          ) : (
            <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
              <Building className="h-6 w-6 text-muted-foreground" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground truncate">{venue.name}</h3>
                <div className="flex items-center gap-1 mt-1">
                  <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm text-muted-foreground truncate">
                    {formatAddress(venue)}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                {venue.featured && (
                  <Badge variant="secondary" className="text-xs">
                    Featured
                  </Badge>
                )}
                {venue.rating && venue.rating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs font-medium">{venue.rating.toFixed(1)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4 mt-2">
              {venue.capacity && venue.capacity > 0 && (
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {venue.capacity} guests
                  </span>
                </div>
              )}

              {venue.venue_type && (
                <Badge variant="outline" className="text-xs">
                  {venue.venue_type}
                </Badge>
              )}

              {venue.price_range && (
                <span className="text-xs font-medium text-green-600">
                  {venue.price_range}
                </span>
              )}
            </div>

            {venue.amenities && venue.amenities.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {venue.amenities.slice(0, 3).map((amenity, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {amenity}
                  </Badge>
                ))}
                {venue.amenities.length > 3 && (
                  <span className="text-xs text-muted-foreground">
                    +{venue.amenities.length - 3} more
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  ), [handleVenueSelect, formatAddress]);

  const renderSelectedVenue = useMemo(() => {
    if (!selectedVenue || !showSelectedDetails) return null;

    return (
      <Card className="border-primary/50 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {selectedVenue.image_url ? (
                <img
                  src={selectedVenue.image_url}
                  alt={selectedVenue.name}
                  className="w-12 h-12 object-cover rounded-lg"
                />
              ) : (
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Building className="h-5 w-5 text-primary" />
                </div>
              )}

              <div>
                <h4 className="font-medium text-foreground">{selectedVenue.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {formatAddress(selectedVenue)}
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearSelection}
              className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }, [selectedVenue, showSelectedDetails, formatAddress, handleClearSelection]);

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      {selectedVenue && showSelectedDetails ? (
        renderSelectedVenue
      ) : (
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              type="text"
              placeholder={placeholder}
              value={searchQuery}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              disabled={disabled}
              className={cn(
                'pl-10 pr-10 transition-all duration-200',
                'focus:ring-2 focus:ring-primary/20 focus:border-primary',
                error && 'border-destructive focus:border-destructive',
                isOpen && 'rounded-b-none'
              )}
              required={required}
            />
            <ChevronDown
              className={cn(
                'absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground transition-transform duration-200',
                isOpen && 'rotate-180'
              )}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive mt-1">{error}</p>
          )}
        </div>
      )}

      {isOpen && showResults && (
        <Card className="absolute z-50 w-full mt-1 max-h-96 overflow-auto border shadow-lg animate-fade-in">
          <CardContent className="p-2">
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3">
                    <Skeleton className="w-16 h-16 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : venues.length > 0 ? (
              <div className="space-y-2">
                {venues.map(renderVenueItem)}
              </div>
            ) : searchQuery.length >= 2 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Building className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No venues found matching "{searchQuery}"</p>
                <p className="text-sm mt-1">Try adjusting your search terms</p>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Start typing to search for venues</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );

};

export default VenueSearchSelect;