import React from 'react';
import { Navigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import SimpleHeader from '@/components/layout/SimpleHeader';
import { useAuth } from '@/providers/AuthProvider';

interface RouteWrapperProps {
  children: React.ReactNode;
  title?: string | undefined;
  description?: string | undefined;
  requiresAuth?: boolean | undefined;
  analyticsPath?: string | undefined;
  analyticsTitle?: string | undefined;
  analyticsEvents?: Array<{ category: string | undefined; action: string }>;
  headerType?: 'full' | 'simple' | 'none';
  showFooter?: boolean;
}

export const RouteWrapper = ({
  children,
  headerType = 'full',
  showFooter = true,
  requiresAuth = false,
}: RouteWrapperProps) => {
  const { user, isLoading } = useAuth();

  if (requiresAuth) {
    if (isLoading) {
      return <div>Loading...</div>;
    }
    if (!user) {
      return <Navigate to='/login' replace />;
    }
  }
  const renderHeader = () => {
    switch (headerType) {
      case 'full':
        return <Header />;
      case 'simple':
        return <SimpleHeader />;
      case 'none':
        return null;
      default:
        return <Header />;
    }
  };

  return (
    <div className='min-h-screen flex flex-col'>
      {renderHeader()}
      <main className='flex-1'>{children}</main>
      {showFooter && (
        <footer className='mt-auto'>{/* Footer component can be added here if needed */}</footer>
      )}
    </div>
  );
};

export default RouteWrapper;
