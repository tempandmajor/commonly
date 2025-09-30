import React from 'react';
import SimpleHeader from '@/components/layout/SimpleHeader';
import Footer from '@/components/layout/Footer';

interface SettingsLayoutProps {
  children: React.ReactNode;
}

const SettingsLayout: React.FC<SettingsLayoutProps> = ({ children }) => {
  return (
    <div className='flex min-h-screen flex-col'>
      <SimpleHeader />
      <main className='flex-1 container mx-auto px-4 py-8'>{children}</main>
      <Footer />
    </div>
  );
};

export default SettingsLayout;
