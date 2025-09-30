import { useEffect, useState } from 'react';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/components/theme-provider';
import { LocationProvider } from '@/providers/LocationProvider';
import { AuthProvider } from '@/providers/AuthProvider';
import { PageLoader } from '@/components/ui/page-loader';
import StorageQuotaHandler from '@/components/ui/storage-quota-handler';
import { createLogger } from '@/utils/logger';
import createRoutes from './routes';
import ErrorBoundary from './components/common/ErrorBoundary';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error && typeof error === 'object' && 'status' in error) {
          const status = (error as { status: number }).status;
          if (status >= 400 && status < 500) {
            return false;
          }
        }
        return failureCount < 3;
      },
    },
  },
});

// Create a logger for the App component
const logger = createLogger('App');

const App = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [router, setRouter] = useState<Awaited<ReturnType<typeof createRoutes>> | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      logger.info('App component mounted');
      try {
        const routerInstance = await createRoutes();
        setRouter(routerInstance);
        setIsInitialized(true);
      } catch (error) {
        logger.error('Failed to initialize router:', error);
      }
    };

    initializeApp();

    return () => {
      logger.info('App component unmounted');
    };
  }, []);

  if (!isInitialized || !router) {
    return <PageLoader />;
  }

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme='light' storageKey='commonly-ui-theme'>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <LocationProvider>
              <RouterProvider router={router} />
              <Toaster />
              <StorageQuotaHandler />
            </LocationProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
