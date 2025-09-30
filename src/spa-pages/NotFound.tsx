import { useLocation, Link } from 'react-router-dom';
import { useEffect } from 'react';
import SimpleHeader from '@/components/layout/SimpleHeader';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { useAnalytics } from '@/hooks/useAnalytics';

const NotFound = () => {
  const location = useLocation();
  const { track } = useAnalytics('/404', 'Page Not Found');

  useEffect(() => {
    // Track 404 errors for analytics
    track('page_not_found', {
      path: location.pathname,
      referrer: document.referrer || 'direct',
    });
  }, [location.pathname, track]);

  return (
    <div className='flex min-h-screen flex-col'>
      <SimpleHeader />

      <main className='flex flex-1 items-center justify-center bg-secondary/30 px-4 py-24 md:py-32'>
        <div className='max-w-md text-center'>
          <h1 className='text-6xl font-bold tracking-tight'>404</h1>
          <p className='mt-4 text-xl text-muted-foreground'>
            Oops! We couldn't find the page you're looking for.
          </p>
          <p className='mt-2 text-muted-foreground'>
            The link you followed may be broken, or the page may have been removed.
          </p>
          <div className='mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center'>
            <Button asChild>
              <Link to='/'>Go back home</Link>
            </Button>
            <Button variant='outline' asChild>
              <Link to='/explore'>Explore events</Link>
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default NotFound;
