import { useState, useEffect, Suspense } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';
import Header from '@/components/layout/Header';
import CategoryNav from '@/components/layout/CategoryNav';
import Footer from '@/components/layout/Footer';
import FeaturedEvents from '@/components/home/FeaturedEvents';
import EventMarketplace from '@/components/home/EventMarketplace';
import { Button } from '@/components/ui/button';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useAuth } from '@/providers/AuthProvider';
import LocationPermissionPrompt from '@/components/location/LocationPermissionPrompt';
import { PageLoader } from '@/components/ui/page-loader';
import { toast } from 'sonner';
import ErrorBoundaryComponent from '@/components/ui/error-boundary';
import { createLogger } from '@/utils/logger';
import { debounce } from '@/utils/debounce';

const logger = createLogger('Index');

const Index = () => {
  const {
    locationInfo,
    getLocation,
    setManualLocation,
    clearManualLocation,
    customPromptShown,
    proceedWithLocationPermission,
  } = useGeolocation();

  const { user } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [pageLoaded, setPageLoaded] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get('category');

  // Debounced scroll handler
  useEffect(() => {
    const handleScroll = debounce(() => {
      setIsScrolled(window.scrollY > 50);
    }, 100);

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Page initialization
  useEffect(() => {
    try {
      // Remove artificial delay
      setPageLoaded(true);
      logger.info('Page loaded successfully', { timestamp: Date.now() });
    } catch (err) {
      logger.error('Error loading page:', err);
      setLoadingError(err instanceof Error ? err.message : 'Unknown error loading page');
      setPageLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (loadingError) {
      toast.error(`Unable to load page. Please refresh and try again.`);
    }
  }, [loadingError]);

  const handleLocationSelect = (location: string) => {
    try {
      setManualLocation(location);
      logger.info('Location manually set', { location });
    } catch (err) {
      logger.error('Error setting location:', err);
      toast.error('Unable to set location. Please try again.');
    }
  };

  const handleRefreshLocation = async () => {
    try {
      await getLocation(true);
    } catch (err) {
      logger.error('Error refreshing location:', err);
      toast.error('Unable to refresh location. Please check your permissions.');
    }
  };

  const handleCancelLocationPrompt = () => {
    try {
      getLocation(true);
    } catch (err) {
      logger.error('Error handling location prompt cancel:', err);
    }
  };

  const handleCategorySelect = (category: string | null) => {
    try {
      const currentCategory = searchParams.get('category');

      // Only update if there's a change
      if (category === currentCategory) {
        return;
      }

      const newParams = new URLSearchParams(searchParams);
      if (category) {
        newParams.set('category', category);
      } else {
        newParams.delete('category');
      }

      // Only update if there's an actual change
      if (newParams.toString() !== searchParams.toString()) {
        setSearchParams(newParams);
      }
    } catch (err) {
      logger.error('Error selecting category:', err);
      toast.error('Unable to filter by category. Please try again.');
    }
  };

  const handleCreateEventClick = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (!user) {
      // Redirect to login page with state for redirect
      navigate('/login', { state: { redirect: '/create' } });
      toast.info('Please sign in to create an event');
    } else {
      // User is authenticated, navigate to create page
      navigate('/create');
    }
  };

  if (!pageLoaded) {
    return <PageLoader />;
  }

  return (
    <div className='flex min-h-screen flex-col bg-white text-[#2B2B2B]'>
      <ErrorBoundaryComponent>
        <Header />
      </ErrorBoundaryComponent>

      <LocationPermissionPrompt
        isOpen={customPromptShown}
        onProceed={proceedWithLocationPermission}
        onCancel={handleCancelLocationPrompt}
      />

      <main className='flex-1'>
        <section className='relative flex min-h-[60vh] items-center justify-center bg-white px-4 py-12 sm:py-16'>
          <div className='container relative z-10 text-center'>
            <div className='mb-6 sm:mb-8 flex justify-center'>
              <img
                src='/lovable-uploads/74d2a052-10a4-495b-b32f-ca692cde2f31.png'
                alt='Commonly - Discover & Support Amazing Events'
                className='h-20 sm:h-32'
                loading='lazy'
                onError={e => {
                  logger.error('Failed to load logo image');
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>

            <h1 className='text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-[#2B2B2B]'>
              Discover & Support
              <span className='block mt-1'>Amazing Events</span>
            </h1>

            <p className='mx-auto mt-4 sm:mt-6 max-w-xl text-sm sm:text-base text-[#2B2B2B]/80 px-4'>
              Find unique events to attend and help creators bring their ideas to life through
              community pre sale event ticketing.
            </p>

            <div className='mx-auto mt-6 sm:mt-8 flex flex-col sm:flex-row justify-center gap-3 px-4'>
              <Button
                variant='outline'
                className='gap-2 w-full sm:w-auto'
                onClick={handleCreateEventClick}
              >
                <PlusCircle className='h-4 w-4' />
                Create Your Event
              </Button>

              <Button className='w-full sm:w-auto' asChild>
                <Link to='/explore'>Browse Events</Link>
              </Button>
            </div>
          </div>
        </section>

        <CategoryNav activeCategory={activeCategory} onSelectCategory={handleCategorySelect} />

        <Suspense
          fallback={
            <div className='py-8'>
              <PageLoader />
            </div>
          }
        >
          {/* Only show Featured Events when no category filter is active */}
          {!activeCategory && (
            <ErrorBoundaryComponent>
              <FeaturedEvents />
            </ErrorBoundaryComponent>
          )}

          <ErrorBoundaryComponent>
            {/* Add a clear section title when category filter is active */}
            {activeCategory && (
              <div className='container mx-auto px-4 pt-8 pb-4'>
                <div className='flex items-center justify-between'>
                  <h2 className='text-2xl font-bold text-[#2B2B2B]'>
                    {activeCategory === 'all'
                      ? 'All Events'
                      : `${activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)} Events`}
                  </h2>
                  <Button
                    variant='ghost'
                    onClick={() => handleCategorySelect(null)}
                    className='text-sm text-muted-foreground hover:text-[#2B2B2B]'
                  >
                    Clear Filter
                  </Button>
                </div>
              </div>
            )}
            <EventMarketplace />
          </ErrorBoundaryComponent>
        </Suspense>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
