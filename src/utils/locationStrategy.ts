/**
 * Cost-Effective Geolocation Strategy
 *
 * This implements a tiered approach to minimize costs while maximizing reliability:
 * 1. FREE: Browser geolocation + local caching
 * 2. FREE: OpenStreetMap Nominatim (rate limited)
 * 3. FREE: User manual input with autocomplete
 * 4. PAID: Google Maps API (only when absolutely needed)
 */

// Cost tracking interface
interface LocationCosts {
  freeApiCalls: number;
  paidApiCalls: number;
  cacheHits: number;
  lastReset: Date;
}

// Location cache with expiration
interface CachedLocation {
  coordinates: { lat: number; lng: number };
  cityName: string;
  timestamp: Date;
  source: 'browser' | 'nominatim' | 'google' | 'manual';
}

class CostEffectiveLocationService {
  private cache = new Map<string, CachedLocation>();
  private costs: LocationCosts = {
    freeApiCalls: 0,
    paidApiCalls: 0,
    cacheHits: 0,
    lastReset: new Date(),
  };

  // Rate limiting for free services
  private lastNominatimCall = 0;
  private nominatimCooldown = 1000; // 1 second between calls

  // Cache duration: 24 hours for cities, 1 hour for precise coordinates
  private readonly CACHE_DURATION_CITY = 24 * 60 * 60 * 1000;
  private readonly CACHE_DURATION_COORDS = 60 * 60 * 1000;

  /**
   * TIER 1: Check cache first (FREE)
   */
  private getCachedLocation(lat: number, lng: number): CachedLocation | null {
    const key = this.getCacheKey(lat, lng);
    const cached = this.cache.get(key);

    if (cached) {
      const age = Date.now() - cached.timestamp.getTime();
      const maxAge =
        cached.source === 'manual' ? this.CACHE_DURATION_CITY : this.CACHE_DURATION_COORDS;

      if (age < maxAge) {
        this.costs.cacheHits++;
        return cached;
      }

      // Expired cache
      this.cache.delete(key);
    }

    return null;
  }

  /**
   * TIER 2: OpenStreetMap Nominatim (FREE with rate limits)
   */
  private async geocodeWithNominatim(lat: number, lng: number): Promise<string | null> {
    // Respect rate limits
    const now = Date.now();
    if (now - this.lastNominatimCall < this.nominatimCooldown) {
      await new Promise(resolve => setTimeout(resolve, this.nominatimCooldown));
    }
    this.lastNominatimCall = Date.now();

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'CommonlyApp/1.0 (contact@commonly.app)', // Required by Nominatim
          },
        }
      );

      if (!response.ok) throw new Error('Nominatim request failed');

      const data = await response.json();
      this.costs.freeApiCalls++;

      if (data.address) {
        const city = data.address.city || data.address.town || data.address.village;
        const state = data.address.state;
        const country = data.address.country;

        let cityName = city;
        if (city && state) {
          cityName = `${city}, ${state}`;
        } else if (state) {
          cityName = state;
        } else if (country) {
          cityName = country;
        }

        if (cityName) {
          this.cacheLocation(lat, lng, cityName, 'nominatim');
          return cityName;
        }
      }
    } catch (error) {
      console.warn('Nominatim geocoding failed:', error);
    }

    return null;
  }

  /**
   * TIER 3: Google Maps API (PAID - use sparingly)
   */
  private async geocodeWithGoogle(lat: number, lng: number): Promise<string | null> {
    // Only use Google if other methods failed and it's critical
    if (!window.google?.maps?.Geocoder) {
      console.warn('Google Maps not loaded, skipping');
      return null;
    }

    try {
      const geocoder = new (window.google.maps as any).Geocoder();
      const response = await geocoder.geocode({
        location: { lat, lng },
      });

      this.costs.paidApiCalls++; // Track cost

      if (response.results.length > 0) {
        const result = response.results[0];
        const city = this.extractCityFromGoogle(result);

        if (city) {
          this.cacheLocation(lat, lng, city, 'google');
          return city;
        }
      }
    } catch (error) {
      console.warn('Google geocoding failed:', error);
    }

    return null;
  }

  /**
   * TIER 4: Fallback to smart coordinate display
   */
  private createSmartCoordinateDisplay(lat: number, lng: number): string {
    // Create a user-friendly coordinate display
    const latDir = lat >= 0 ? 'N' : 'S';
    const lngDir = lng >= 0 ? 'E' : 'W';

    return `${Math.abs(lat).toFixed(1)}°${latDir}, ${Math.abs(lng).toFixed(1)}°${lngDir}`;
  }

  /**
   * Main public method: Get location with cost optimization
   */
  public async getLocationName(
    lat: number,
    lng: number,
    priority: 'cost' | 'speed' | 'accuracy' = 'cost'
  ): Promise<string> {
    // TIER 1: Check cache first
    const cached = this.getCachedLocation(lat, lng);
    if (cached) {
      return cached.cityName;
    }

    let cityName: string | null = null;

    // TIER 2: Try free services first
    if (priority === 'cost' || priority === 'accuracy') {
      cityName = await this.geocodeWithNominatim(lat, lng);
    }

    // TIER 3: Use paid service only if free failed and it's important
    if (!cityName && (priority === 'speed' || priority === 'accuracy')) {
      cityName = await this.geocodeWithGoogle(lat, lng);
    }

    // TIER 4: Fallback to smart coordinate display
    if (!cityName) {
      cityName = this.createSmartCoordinateDisplay(lat, lng);
      this.cacheLocation(lat, lng, cityName, 'browser');
    }

    return cityName;
  }

  /**
   * Manual location setting (FREE)
   */
  public setManualLocation(locationName: string, coordinates?: { lat: number; lng: number }): void {
    if (coordinates) {
      this.cacheLocation(coordinates.lat, coordinates.lng, locationName, 'manual');
    } else {
      // Save manual location for later coordinate lookup
      localStorage.setItem('userPreferredLocation', locationName);
    }
  }

  /**
   * Cost monitoring
   */
  public getCostReport(): LocationCosts {
    return { ...this.costs };
  }

  public resetCosts(): void {
    this.costs = {
      freeApiCalls: 0,
      paidApiCalls: 0,
      cacheHits: 0,
      lastReset: new Date(),
    };
  }

  // Helper methods
  private getCacheKey(lat: number, lng: number): string {
    // Round to ~1km precision for caching efficiency
    const precision = 2;
    return `${lat.toFixed(precision)},${lng.toFixed(precision)}`;
  }

  private cacheLocation(
    lat: number,
    lng: number,
    cityName: string,
    source: CachedLocation['source']
  ): void {
    const key = this.getCacheKey(lat, lng);
    this.cache.set(key, {
      coordinates: { lat, lng },
      cityName,
      timestamp: new Date(),
      source,
    });
  }

  private extractCityFromGoogle(result: any): string | null {
    for (const component of result.address_components) {
      if (component.types.includes('locality')) {
        const city = component.long_name;
        const state = result.address_components.find((c: any) =>
          c.types.includes('administrative_area_level_1')
        )?.short_name;

        return state ? `${city}, ${state}` : city;
      }
    }
    return null;
  }
}

// Singleton instance
export const locationService = new CostEffectiveLocationService();

// React hook for easy integration
export const useCostEffectiveLocation = () => {
  return {
    getLocationName: locationService.getLocationName.bind(locationService),
    setManualLocation: locationService.setManualLocation.bind(locationService),
    getCostReport: locationService.getCostReport.bind(locationService),
    resetCosts: locationService.resetCosts.bind(locationService),
  };
};
