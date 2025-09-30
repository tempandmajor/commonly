import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  User,
  Settings,
  Bell,
  MessageSquare,
  Ticket,
  Shield,
  Eye,
  BarChart3,
  LogOut,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import SimpleHeader from '@/components/layout/SimpleHeader';
import Footer from '@/components/layout/Footer';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: LucideIcon;
  description: string;
  badge?: string | undefined;
}

const AccountLayout = () => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const navigationItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      path: '/account',
      icon: BarChart3,
      description: 'Account overview and activity summary',
    },
    {
      id: 'profile',
      label: 'Profile',
      path: '/account/profile',
      icon: User,
      description: 'Edit your public profile information',
    },
    {
      id: 'settings',
      label: 'Settings',
      path: '/account/settings',
      icon: Settings,
      description: 'Manage your account preferences',
    },
    {
      id: 'notifications',
      label: 'Notifications',
      path: '/account/notifications',
      icon: Bell,
      description: 'Manage notification preferences and history',
    },
    {
      id: 'messages',
      label: 'Messages',
      path: '/account/messages',
      icon: MessageSquare,
      description: 'Chat with other community members',
    },
    {
      id: 'tickets',
      label: 'My Tickets',
      path: '/account/tickets',
      icon: Ticket,
      description: 'View and manage your event tickets',
    },
    {
      id: 'security',
      label: 'Security',
      path: '/account/security',
      icon: Shield,
      description: 'Password, 2FA, and security settings',
    },
    {
      id: 'privacy',
      label: 'Privacy',
      path: '/account/privacy',
      icon: Eye,
      description: 'Control your privacy and data settings',
    },
  ];

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Signed out successfully');
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };

  const isActivePath = (path: string) => {
    if (path === '/account') {
      return location.pathname === '/account';
    }
    return location.pathname.startsWith(path);
  };

  const getUserDisplayName = () => {
    return (user as any)?.display_name ||
           (user as any)?.name ||
           user?.user_metadata?.display_name ||
           user?.user_metadata?.name ||
           'User';
  };

  const getUserAvatar = () => {
    return (user as any)?.avatar_url ||
           user?.user_metadata?.avatar_url ||
           '';
  };

  return (
    <div className="flex min-h-screen flex-col">
      <SimpleHeader />

      <main className="flex-1 container max-w-screen-xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardContent className="p-6">
                {/* User Info Header */}
                <div className="flex items-center gap-3 mb-6">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={getUserAvatar()} />
                    <AvatarFallback>
                      {getUserDisplayName().split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <h3 className="font-semibold truncate">{getUserDisplayName()}</h3>
                    <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
                  </div>
                </div>

                <Separator className="mb-6" />

                {/* Navigation Menu */}
                <nav className="space-y-1">
                  {navigationItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = isActivePath(item.path);

                    return (
                      <Link
                        key={item.id}
                        to={item.path}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-gray-100 ${
                          isActive ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'text-gray-700'
                        }`}
                      >
                        <Icon className="h-4 w-4 flex-shrink-0" />
                        <span className="font-medium">{item.label}</span>
                        {item.badge && (
                          <Badge variant="secondary" className="ml-auto">
                            {item.badge}
                          </Badge>
                        )}
                        <ChevronRight className="h-3 w-3 ml-auto opacity-50" />
                      </Link>
                    );
                  })}
                </nav>

                <Separator className="my-6" />

                {/* Sign Out */}
                <Button
                  variant="ghost"
                  onClick={handleSignOut}
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4 mr-3" />
                  Sign Out
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            <Outlet />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AccountLayout;