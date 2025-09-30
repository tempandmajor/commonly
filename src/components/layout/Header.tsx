import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import AuthButtons from './AuthButtons';
import UserMenu from './UserMenu';
import MobileMenu from './MobileMenu';
import NotificationDropdown from '@/components/notifications/NotificationDropdown';
import {
  Search,
  MapPin,
  ChevronDown,
  Compass,
  Building,
  ChefHat,
  RefreshCw,
  MessageSquare,
} from 'lucide-react';
import { useGeolocation } from '@/hooks/useGeolocation';
import { toast } from 'sonner';

const Header: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  // Use the comprehensive geolocation hook instead of the basic one
  const { locationInfo, getLocation, setManualLocation, customPromptShown } = useGeolocation();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/explore?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const navigationItems = [
    {
      label: 'Explore',
      href: '/explore',
      icon: Compass,
      description: 'Discover events and content',
    },
    {
      label: 'Venues',
      href: '/venues',
      icon: Building,
      description: 'Find perfect event spaces',
    },
    {
      label: 'Caterers',
      href: '/caterers',
      icon: ChefHat,
      description: 'Professional catering services',
    },
  ];

  // Smart location display with cost-effective fallbacks
  const getLocationDisplay = () => {
    if (locationInfo.loading) return 'Finding location...';
    if (locationInfo.error) return 'Set location';

    // Priority order for location display:
    // 1. Formatted address (e.g., "San Francisco, CA")
    // 2. City name
    // 3. Smart coordinate display (for better UX than raw numbers)
    // 4. Default fallback
    if (locationInfo.formatted) return locationInfo.formatted;
    if (locationInfo.city) return locationInfo.city;

    // If we only have coordinates, show a user-friendly format
    if (locationInfo.coordinates.latitude && locationInfo.coordinates.longitude) {
      return `Near ${locationInfo.coordinates.latitude.toFixed(1)}°, ${locationInfo.coordinates.longitude.toFixed(1)}°`;
    }

    return 'Set location';
  };

  // Handle location change - supports both coordinates and city names
  const handleLocationChange = async (lat?: number, lng?: number, cityName?: string) => {
    if (cityName) {
      // User selected a predefined city
      setManualLocation(cityName);
    } else if (lat && lng) {
      // User selected predefined coordinates - set manual location with coordinates
      const locationString = `${lat.toFixed(1)}°, ${lng.toFixed(1)}°`;
      setManualLocation(locationString);
    }
  };

  return (
    <header className='sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
      <div className='container mx-auto flex h-16 items-center justify-between px-4'>
        {/* Logo */}
        <div className='flex items-center'>
          <Link to='/' className='flex items-center hover:opacity-80 transition-opacity'>
            <img
              src='/lovable-uploads/56de9571-cb1d-46dc-a260-f44a0d6cd3ff.png'
              alt='Commonly'
              className='h-12 w-auto'
            />
          </Link>
        </div>

        {/* Navigation - Hidden on mobile */}
        <nav className='hidden md:flex items-center space-x-1'>
          {navigationItems.map(item => (
            <Link key={item.href} to={item.href}>
              <Button variant='ghost' className='flex items-center gap-2'>
                <item.icon className='h-4 w-4' />
                {item.label}
              </Button>
            </Link>
          ))}
        </nav>

        {/* Search Bar - Hidden on mobile */}
        <div className='hidden lg:flex flex-1 max-w-md mx-6'>
          <form onSubmit={handleSearch} className='relative w-full'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
            <Input
              type='search'
              placeholder='Search events, venues, creators...'
              value={searchQuery}
              onChange={e => setSearchQuery((e.target as HTMLInputElement).value)}
              className='pl-10 pr-4'
            />
          </form>
        </div>

        {/* Right Side - Location, Notifications, Auth, Mobile Menu */}
        <div className='flex items-center space-x-3'>
          {/* Location Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='ghost'
                size='sm'
                className='hidden sm:flex items-center gap-2 text-sm'
                disabled={locationInfo.loading}
              >
                {locationInfo.loading ? (
                  <RefreshCw className='h-4 w-4 animate-spin' />
                ) : (
                  <MapPin className='h-4 w-4' />
                )}
                <span className='max-w-24 truncate'>{getLocationDisplay()}</span>
                <ChevronDown className='h-3 w-3' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-56'>
              <DropdownMenuItem
                onClick={() => handleLocationChange(undefined, undefined, 'New York, NY')}
              >
                <MapPin className='mr-2 h-4 w-4' />
                New York, NY
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleLocationChange(undefined, undefined, 'Los Angeles, CA')}
              >
                <MapPin className='mr-2 h-4 w-4' />
                Los Angeles, CA
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleLocationChange(undefined, undefined, 'Chicago, IL')}
              >
                <MapPin className='mr-2 h-4 w-4' />
                Chicago, IL
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleLocationChange(undefined, undefined, 'Miami, FL')}
              >
                <MapPin className='mr-2 h-4 w-4' />
                Miami, FL
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={async () => {
                  if (!navigator.geolocation) {
                    toast.error('Geolocation is not supported by your browser');
                    return;
                  }

                  try {
                    // Use the proper geolocation hook instead of direct browser API
                    await getLocation(true);
                    toast.success('Location updated successfully');
                  } catch (error) {
                    toast.error(
                      'Unable to get your current location. Please check your browser permissions.'
                    );
                  }
                }}
              >
                <RefreshCw className='mr-2 h-4 w-4' />
                Use Current Location
              </DropdownMenuItem>
              {locationInfo.formatted && (
                <DropdownMenuItem
                  onClick={() => {
                    // Clear location without page refresh
                    localStorage.removeItem('manualLocation');
                    // Reset location state using the geolocation hook
                    setManualLocation('');
                    toast.success('Location cleared successfully');
                  }}
                >
                  <MapPin className='mr-2 h-4 w-4 opacity-50' />
                  Clear Location
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Future enhancement: Show number of nearby events based on selected location */}

          {/* Notifications - Only show for authenticated users */}
          {user && <NotificationDropdown />}

          {/* Messages - Only show for authenticated users */}
          {user && (
            <Button
              variant='ghost'
              size='sm'
              onClick={() => navigate('/messages')}
              className='relative'
            >
              <MessageSquare className='h-5 w-5' />
            </Button>
          )}

          {/* Auth Section */}
          {user ? <UserMenu /> : <AuthButtons />}

          {/* Mobile Menu */}
          <MobileMenu />
        </div>
      </div>

      {/* Mobile Search Bar */}
      <div className='lg:hidden border-t px-4 py-3'>
        <form onSubmit={handleSearch} className='relative'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
          <Input
            type='search'
            placeholder='Search events, venues, creators...'
            value={searchQuery}
            onChange={e => setSearchQuery((e.target as HTMLInputElement).value)}
            className='pl-10 pr-4'
          />
        </form>
      </div>
    </header>
  );
};

export default Header;
