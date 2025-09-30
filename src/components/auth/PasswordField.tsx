import React, { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordStrengthIndicator } from '@/components/forms/shared';

interface PasswordFieldProps {
  form: UseFormReturn<any>;
  name: string;
  label: string;
  placeholder: string;
  required?: boolean | undefined;
  showStrengthIndicator?: boolean | undefined;
  className?: string | undefined;
}

export const PasswordField: React.FC<PasswordFieldProps> = ({
  form,
  name,
  label,
  placeholder,
  required = false,
  showStrengthIndicator = false,
  className = '',
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const error = form.formState.errors[name];
  const value = form.watch(name);

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor={name} className="text-sm font-medium">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          id={name}
          type={showPassword ? 'text' : 'password'}
          placeholder={placeholder}
          className="pl-10 pr-10"
          {...form.register(name)}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </Button>
      </div>
      {error && (
        <p className="text-sm text-destructive">
          {error.message as string}
        </p>
      )}
      {showStrengthIndicator && value && (
        <PasswordStrengthIndicator password={value} />
      )}
    </div>
  );
};