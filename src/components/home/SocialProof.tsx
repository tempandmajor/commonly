import React, { memo } from 'react';
import { Users, TrendingUp, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Stat {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string } | undefined | undefined | undefined>;
  trend?: string;
}

interface SocialProofProps {
  className?: string | undefined;
}

const stats: Stat[] = [
  {
    label: 'Active Users',
    value: '50K+',
    icon: Users,
    trend: '+12% this month',
  },
  {
    label: 'Events Created',
    value: '10K+',
    icon: Calendar,
    trend: '+25% this month',
  },
  {
    label: 'Success Rate',
    value: '94%',
    icon: TrendingUp,
    trend: 'All-time high',
  },
  {
    label: 'Community Love',
    value: '4.9★',
    icon: Heart,
    trend: '2K+ reviews',
  },
];

const SocialProof = memo(({ className }: SocialProofProps) => {
  return (
    <section className={cn('py-12 border-y bg-muted/30', className)}>
      <div className='container px-4 md:px-6'>
        <div className='text-center mb-8'>
          <h3 className='text-2xl font-bold mb-2'>Trusted by Thousands</h3>
          <p className='text-muted-foreground'>
            Join a thriving community of event creators and attendees
          </p>
        </div>

        <div className='grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8'>
          {stats.map(stat => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className='text-center group'>
                <div className='inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-3 group-hover:bg-primary/20 transition-colors'>
                  <Icon className='w-6 h-6 text-primary' />
                </div>
                <div className='space-y-1'>
                  <p className='text-2xl md:text-3xl font-bold'>{stat.value}</p>
                  <p className='text-sm text-muted-foreground'>{stat.label}</p>
                  {stat.trend && <p className='text-xs text-primary'>{stat.trend}</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
});

SocialProof.displayName = 'SocialProof';

export default SocialProof;
