import {
  User as LucideUser,
  Lock,
  Bell,
  CreditCard,
  Globe,
  Shield,
  HelpCircle,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useNavigate, useLocation } from 'react-router-dom';

interface SettingsSidebarProps {
  activeTab: string;
  onSignOut: () => void;
  onTabChange: (tab: string) => void;
}

const SettingsSidebar = ({ activeTab, onSignOut, onTabChange }: SettingsSidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (path: string) => {
    // Update URL
    navigate(`/settings?tab=${path}`);
    // Update active tab in parent component to ensure proper display
    onTabChange(path);
  };

  return (
    <nav className='space-y-1 w-full'>
      <Button
        variant='ghost'
        className={`w-full justify-start ${activeTab === 'profile' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}
        onClick={() => handleNavigation('profile')}
      >
        <LucideUser className='mr-2 h-4 w-4' />
        <span>Profile</span>
      </Button>

      <Button
        variant='ghost'
        className={`w-full justify-start ${activeTab === 'security' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}
        onClick={() => handleNavigation('security')}
      >
        <Lock className='mr-2 h-4 w-4' />
        <span>Security</span>
      </Button>

      <Button
        variant='ghost'
        className={`w-full justify-start ${activeTab === 'notifications' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}
        onClick={() => handleNavigation('notifications')}
      >
        <Bell className='mr-2 h-4 w-4' />
        <span>Notifications</span>
      </Button>

      <Button
        variant='ghost'
        className={`w-full justify-start ${activeTab === 'payments' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}
        onClick={() => handleNavigation('payments')}
      >
        <CreditCard className='mr-2 h-4 w-4' />
        <span>Payment Methods</span>
      </Button>

      <Button
        variant='ghost'
        className={`w-full justify-start ${activeTab === 'language' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}
        onClick={() => handleNavigation('language')}
      >
        <Globe className='mr-2 h-4 w-4' />
        <span>Language & Region</span>
      </Button>

      <Button
        variant='ghost'
        className={`w-full justify-start ${activeTab === 'privacy' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}
        onClick={() => handleNavigation('privacy')}
      >
        <Shield className='mr-2 h-4 w-4' />
        <span>Privacy</span>
      </Button>

      <Separator className='my-4' />

      <Button
        variant='ghost'
        className='w-full justify-start text-muted-foreground hover:bg-secondary hover:text-foreground'
        onClick={() => handleNavigation('help')}
      >
        <HelpCircle className='mr-2 h-4 w-4' />
        <span>Help & Support</span>
      </Button>

      <Button
        variant='ghost'
        className='w-full justify-start text-red-500 hover:bg-red-100 hover:text-red-600'
        onClick={onSignOut}
      >
        <LogOut className='mr-2 h-4 w-4' />
        <span>Sign Out</span>
      </Button>
    </nav>
  );
};

export default SettingsSidebar;
