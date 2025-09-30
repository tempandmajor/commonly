import { createBrowserRouter, RouteObject } from 'react-router-dom';

let router: ReturnType<typeof createBrowserRouter> | null = null;

const createRoutes = async () => {
  if (typeof window !== 'undefined' && !router) {
    // Dynamic imports to avoid SSR issues
    const [
      { publicRoutes },
      { adminRoutes },
      { authRoutes },
      { contentRoutes },
      { creatorRoutes },
      { venueRoutes },
      { catererRoutes },
      { accountRoutes },
      { default: ErrorBoundaryComponent },
      { default: NotFound },
    ] = await Promise.all([
      import('./routes/publicRoutes'),
      import('./routes/adminRoutes'),
      import('./routes/authRoutes'),
      import('./routes/contentRoutes'),
      import('./routes/creatorRoutes'),
      import('./routes/venueRoutes'),
      import('./routes/catererRoutes'),
      import('./routes/accountRoutes'),
      import('./components/ui/error-boundary'),
      import('./spa-pages/NotFound'),
    ]);

    const routeConfig: RouteObject[] = [
          ...publicRoutes,
          ...adminRoutes,
          ...authRoutes,
          ...contentRoutes,
          ...creatorRoutes,
          ...venueRoutes,
          ...catererRoutes,
          ...accountRoutes,
      {
        path: '*',
        element: <NotFound />,
      },
    ];

    router = createBrowserRouter(routeConfig);
  }
  return router;
};

export default createRoutes;
