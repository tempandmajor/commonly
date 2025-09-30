import React from 'react';
import { cn } from '@/lib/utils';
import { Check, X } from 'lucide-react';

interface PasswordStrengthIndicatorProps {
  password: string;
  showRequirements?: boolean | undefined;
  className?: string | undefined;
}

interface PasswordRequirement {
  test: RegExp | ((password: string) => boolean);
  label: string;
}

const requirements: PasswordRequirement[] = [
  { test: (p: string) => p.length >= 8, label: 'At least 8 characters' },
  { test: /[A-Z]/, label: 'One uppercase letter' },
  { test: /[a-z]/, label: 'One lowercase letter' },
  { test: /[0-9]/, label: 'One number' },
  { test: /[^A-Za-z0-9]/, label: 'One special character' },
];

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  showRequirements = true,
  className,
}) => {
  const getStrength = (password: string): number => {
    if (!password) return 0;

    let strength = 0;
    requirements.forEach(req => {
      const passes = typeof req.test === 'function' ? req.test(password) : req.test.test(password);
      if (passes) strength++;
    });

    return strength;
  };

  const strength = getStrength(password);
  const percentage = (strength / requirements.length) * 100;

  const getStrengthText = () => {
    if (strength === 0) return { text: 'Enter password', color: 'text-muted-foreground' };
    if (strength <= 2) return { text: 'Weak', color: 'text-gray-600' };
    if (strength <= 3) return { text: 'Fair', color: 'text-gray-700' };
    if (strength <= 4) return { text: 'Good', color: 'text-gray-800' };
    return { text: 'Strong', color: 'text-black' };
  };

  const { text, color } = getStrengthText();

  const getBarColor = () => {
    if (strength === 0) return 'bg-gray-200';
    if (strength <= 2) return 'bg-gray-400';
    if (strength <= 3) return 'bg-gray-500';
    if (strength <= 4) return 'bg-gray-700';
    return 'bg-black';
  };

  return (
    <div className={cn('space-y-2', className)}>
      {/* Strength bar */}
      <div className='space-y-1'>
        <div className='h-2 w-full bg-gray-200 rounded-full overflow-hidden'>
          <div
            className={cn('h-full transition-all duration-300', getBarColor())}
            style={{ width: `${percentage}%` }}
          />
        </div>
        {password && <p className={cn('text-xs', color)}>{text} password</p>}
      </div>

      {/* Requirements list */}
      {showRequirements && password && (
        <ul className='space-y-1 text-xs'>
          {requirements.map((req, index) => {
            const passes =
              typeof req.test === 'function' ? req.test(password) : req.test.test(password);

            return (
              <li
                key={index}
                className={cn(
                  'flex items-center gap-1.5 transition-colors',
                  passes ? 'text-green-600' : 'text-muted-foreground'
                )}
              >
                {passes ? <Check className='h-3 w-3' /> : <X className='h-3 w-3' />}
                {req.label}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
