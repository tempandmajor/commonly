import React from 'react';
import {
  Menu,
  Compass,
  Building,
  ChefHat,
  Mic,
  User,
  Settings,
  Calendar,
  Plus,
  Users,
  Folder,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/providers/AuthProvider';
import { useNavigate } from 'react-router-dom';

const MobileMenu: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);

  const handleNavigation = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant='ghost' size='sm' className='md:hidden'>
          <Menu className='h-5 w-5' />
        </Button>
      </SheetTrigger>
      <SheetContent side='right' className='w-[300px] sm:w-[400px]'>
        <nav className='flex flex-col space-y-2 mt-6'>
          {/* Main Navigation */}
          <div className='space-y-2'>
            <p className='text-sm font-medium text-muted-foreground px-3 mb-2'>Discover</p>
            <Button
              variant='ghost'
              className='w-full justify-start'
              onClick={() => handleNavigation('/')}
            >
              <Compass className='mr-2 h-4 w-4' />
              Home
            </Button>
            <Button
              variant='ghost'
              className='w-full justify-start'
              onClick={() => handleNavigation('/explore')}
            >
              <Compass className='mr-2 h-4 w-4' />
              Explore
            </Button>
            <Button
              variant='ghost'
              className='w-full justify-start'
              onClick={() => handleNavigation('/venues')}
            >
              <Building className='mr-2 h-4 w-4' />
              Venues
            </Button>
            <Button
              variant='ghost'
              className='w-full justify-start'
              onClick={() => handleNavigation('/caterers')}
            >
              <ChefHat className='mr-2 h-4 w-4' />
              Caterers
            </Button>
            <Button
              variant='ghost'
              className='w-full justify-start'
              onClick={() => handleNavigation('/community')}
            >
              <Users className='mr-2 h-4 w-4' />
              Community
            </Button>
            <Button
              variant='ghost'
              className='w-full justify-start'
              onClick={() => handleNavigation('/community')}
            >
              <Users className='mr-2 h-4 w-4' />
              Community
            </Button>
          </div>

          <Separator />

          {/* Content */}
          <div className='space-y-2'>
            <p className='text-sm font-medium text-muted-foreground px-3 mb-2'>Content</p>
          </div>

          {user ? (
            <>
              <Separator />

              {/* User Actions */}
              <div className='space-y-2'>
                <p className='text-sm font-medium text-muted-foreground px-3 mb-2'>My Account</p>
                <Button
                  variant='ghost'
                  className='w-full justify-start'
                  onClick={() => handleNavigation('/dashboard')}
                >
                  <Calendar className='mr-2 h-4 w-4' />
                  Dashboard
                </Button>
                <Button
                  variant='ghost'
                  className='w-full justify-start'
                  onClick={() => handleNavigation('/create-event')}
                >
                  <Plus className='mr-2 h-4 w-4' />
                  Create Event
                </Button>
                <Button
                  variant='ghost'
                  className='w-full justify-start'
                  onClick={() => handleNavigation('/profile')}
                >
                  <User className='mr-2 h-4 w-4' />
                  Profile
                </Button>
                <Button
                  variant='ghost'
                  className='w-full justify-start'
                  onClick={() => handleNavigation('/wallet')}
                >
                  <Wallet className='mr-2 h-4 w-4' />
                  Wallet
                </Button>
                <Button
                  variant='ghost'
                  className='w-full justify-start'
                  onClick={() => handleNavigation('/settings')}
                >
                  <Settings className='mr-2 h-4 w-4' />
                  Settings
                </Button>
              </div>
            </>
          ) : (
            <>
              <Separator />
              <div className='px-3'>
                <Button className='w-full' onClick={() => handleNavigation('/auth')}>
                  Sign In
                </Button>
              </div>
            </>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
};

export default MobileMenu;
