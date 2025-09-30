import { RouteObject, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { LoadingSpinner } from '@/components/ui/loading';

// Lazy load all components for better performance
const Home = lazy(() => import('@/spa-pages/Home'));
const NotFound = lazy(() => import('@/spa-pages/NotFound'));
const Contact = lazy(() => import('@/spa-pages/Contact'));
const Index = lazy(() => import('@/spa-pages/Index'));
const Profile = lazy(() => import('@/spa-pages/Profile'));
const RouteWrapper = lazy(() => import('@/components/layout/RouteWrapper'));
const EventDetails = lazy(() => import('@/spa-pages/EventDetails'));
const Explore = lazy(() => import('@/spa-pages/Explore'));
const CommunitiesPage = lazy(() => import('@/spa-pages/CommunitiesPage'));
const CommunityDetailPage = lazy(() => import('@/spa-pages/CommunityDetailPage'));
const CreateCommunityPage = lazy(() => import('@/spa-pages/CreateCommunityPage'));
const PaymentSuccess = lazy(() => import('@/spa-pages/PaymentSuccess'));
const PaymentCancelled = lazy(() => import('@/spa-pages/PaymentCancelled'));
const PurchaseSuccess = lazy(() => import('@/spa-pages/PurchaseSuccess'));
const Dashboard = lazy(() => import('@/spa-pages/Dashboard'));
const Wallet = lazy(() => import('@/spa-pages/Wallet'));
const AddPaymentMethod = lazy(() => import('@/spa-pages/AddPaymentMethod'));
const HelpCenter = lazy(() => import('@/spa-pages/HelpCenter'));
const CreatorProgram = lazy(() => import('@/spa-pages/CreatorProgram'));
const ReferralDashboard = lazy(() => import('@/components/referrals/ReferralDashboard'));
const CatererListingForm = lazy(() => import('@/spa-pages/CatererListingForm'));

// Loading wrapper component
const LazyWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense
    fallback={
      <div className='flex items-center justify-center min-h-screen'>
        <LoadingSpinner />
      </div>
    }
  >
    {children}
  </Suspense>
);

const LazyRouteWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense
    fallback={
      <div className='flex items-center justify-center min-h-screen'>
        <LoadingSpinner />
      </div>
    }
  >
    <RouteWrapper>{children}</RouteWrapper>
  </Suspense>
);

// Profile redirect component
const ProfileRedirect = () => {
  // This will render the Profile component which handles the case where no username is provided
  return <Profile />;
};

export const publicRoutes: RouteObject[] = [
  {
    path: '/',
    element: (
      <LazyWrapper>
        <Index />
      </LazyWrapper>
    ),
  },
  {
    path: '/home',
    element: (
      <LazyWrapper>
        <Home />
      </LazyWrapper>
    ),
  },
  {
    path: '/contact',
    element: (
      <LazyWrapper>
        <Contact />
      </LazyWrapper>
    ),
  },
  {
    path: '/explore',
    element: (
      <LazyWrapper>
        <Explore />
      </LazyWrapper>
    ),
  },
  {
    path: '/events',
    element: (
      <LazyWrapper>
        <Explore />
      </LazyWrapper>
    ),
  },
  // Add route for /profile without username (current user's profile)
  {
    path: '/profile',
    element: (
      <LazyRouteWrapper>
        <ProfileRedirect />
      </LazyRouteWrapper>
    ),
  },
  // Support both username or user ID for profiles
  {
    path: '/profile/:username',
    element: (
      <LazyRouteWrapper>
        <Profile />
      </LazyRouteWrapper>
    ),
  },
  {
    path: '/events/:eventId',
    element: (
      <LazyWrapper>
        <EventDetails />
      </LazyWrapper>
    ),
  },
  {
    path: '/community',
    element: (
      <LazyWrapper>
        <CommunitiesPage />
      </LazyWrapper>
    ),
  },
  {
    path: '/communities',
    element: <Navigate to='/community' replace />,
  },
  {
    path: '/community/:communityId',
    element: (
      <LazyWrapper>
        <CommunityDetailPage />
      </LazyWrapper>
    ),
  },
  {
    path: '/community/create',
    element: (
      <LazyWrapper>
        <CreateCommunityPage />
      </LazyWrapper>
    ),
  },
  {
    path: '/create-community',
    element: (
      <LazyWrapper>
        <CreateCommunityPage />
      </LazyWrapper>
    ),
  },
  {
    path: '/payment-success',
    element: (
      <LazyWrapper>
        <PaymentSuccess />
      </LazyWrapper>
    ),
  },
  {
    path: '/payment-cancelled',
    element: (
      <LazyWrapper>
        <PaymentCancelled />
      </LazyWrapper>
    ),
  },
  {
    path: '/purchase-success',
    element: (
      <LazyWrapper>
        <PurchaseSuccess />
      </LazyWrapper>
    ),
  },
  {
    path: '/dashboard',
    element: (
      <LazyWrapper>
        <Dashboard />
      </LazyWrapper>
    ),
  },
  {
    path: '/wallet',
    element: (
      <LazyWrapper>
        <Wallet />
      </LazyWrapper>
    ),
  },
  {
    path: '/payments',
    element: <Navigate to='/wallet' replace />,
  },
  {
    path: '/wallet/add-payment-method',
    element: (
      <LazyWrapper>
        <AddPaymentMethod />
      </LazyWrapper>
    ),
  },
  {
    path: '/payments/add-payment-method',
    element: <Navigate to='/wallet/add-payment-method' replace />,
  },
  {
    path: '/help',
    element: (
      <LazyWrapper>
        <HelpCenter />
      </LazyWrapper>
    ),
  },
  {
    path: '/help-center',
    element: <Navigate to='/help' replace />,
  },
  {
    path: '/creator-program',
    element: (
      <LazyWrapper>
        <CreatorProgram />
      </LazyWrapper>
    ),
  },
  {
    path: '/referral-dashboard',
    element: (
      <LazyWrapper>
        <ReferralDashboard />
      </LazyWrapper>
    ),
  },
  {
    path: '/caterers/list-your-business',
    element: (
      <LazyWrapper>
        <CatererListingForm />
      </LazyWrapper>
    ),
  },
  {
    path: '*',
    element: (
      <LazyWrapper>
        <NotFound />
      </LazyWrapper>
    ),
  },
];
