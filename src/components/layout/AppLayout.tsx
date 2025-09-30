import React from 'react';
import SimpleHeader from '@/components/layout/SimpleHeader';
import Footer from '@/components/layout/Footer';

interface AppLayoutProps {
  children: React.ReactNode;
  className?: string | undefined;
  showHeader?: boolean | undefined;
  showFooter?: boolean | undefined;
}

// Lightweight shared layout to replace repeated RouteWrapper usage
export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  className,
  showHeader = true,
  showFooter = true,
}) => {
  return (
    <div className={`flex min-h-screen flex-col bg-white text-[#2B2B2B] ${className ?? ''}`}>
      {showHeader && <SimpleHeader />}
      <main className='flex-1 container px-4 py-8'>{children}</main>
      {showFooter && <Footer />}
    </div>
  );
};

export default AppLayout;
