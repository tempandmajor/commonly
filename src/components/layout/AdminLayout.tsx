import React, { useState } from 'react';
import { Shield, Menu } from 'lucide-react';
import { AdminSidebarNav } from '@/components/admin/navigation/AdminSidebarNav';
import { AdminUserProfile } from '@/components/admin/navigation/AdminUserProfile';
import { AdminFooterNav } from '@/components/admin/navigation/AdminFooterNav';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useMediaQuery } from '@/hooks/useMediaQuery';

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Use media query to detect mobile screens
  const isMobile = useMediaQuery('(max-width: 1024px)');

  return (
    <div className='min-h-screen flex flex-col lg:flex-row'>
      {/* Desktop Sidebar */}
      <div className={cn('w-64 bg-slate-800 text-white p-4 hidden lg:flex flex-col')}>
        <SidebarContent />
      </div>

      {/* Mobile Sidebar with Sheet */}
      <div className='block lg:hidden'>
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant='outline' size='icon' className='fixed top-4 left-4 z-40'>
              <Menu className='h-5 w-5' />
              <span className='sr-only'>Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side='left' className='w-72 bg-slate-800 text-white p-0 border-r-slate-700'>
            <div className='h-full flex flex-col p-4'>
              <SidebarContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className='flex-1 bg-slate-50'>
        {/* Mobile header */}
        <div className='h-16 bg-slate-800 text-white flex items-center justify-center lg:hidden'>
          <div className='flex items-center gap-2'>
            <Shield className='h-5 w-5' />
            <span className='text-xl font-bold'>Admin Portal</span>
          </div>
        </div>

        <div className='p-4 sm:p-8 pt-20 lg:pt-8'>{children}</div>
      </div>
    </div>
  );
};

// Extracted sidebar content to avoid duplication
const SidebarContent = () => (
  <>
    <div className='flex items-center gap-2 text-xl font-bold mb-8 py-2 border-b border-slate-600'>
      <Shield className='h-6 w-6' />
      <span>Admin Portal</span>
    </div>

    <AdminSidebarNav />

    <div className='mt-auto pt-4 border-t border-slate-600'>
      <AdminFooterNav />
      <AdminUserProfile />
    </div>
  </>
);

export default AdminLayout;
