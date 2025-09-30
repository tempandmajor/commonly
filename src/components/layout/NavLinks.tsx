import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const NavLinks: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const links = [
    { path: '/', label: 'Home' },
    { path: '/events', label: 'Events' },
    { path: '/explore', label: 'Explore' },
  ];

  return (
    <nav className='hidden md:flex items-center space-x-1'>
      {links.map(({ path, label }) => (
        <Button
          key={path}
          variant='ghost'
          onClick={() => navigate(path)}
          className={cn(
            'text-sm font-medium',
            location.pathname === path && 'bg-accent text-accent-foreground'
          )}
        >
          {label}
        </Button>
      ))}
    </nav>
  );
};

export default NavLinks;
