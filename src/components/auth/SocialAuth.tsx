import React from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Github, Chrome, Apple } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SocialAuthProps {
  mode: 'login' | 'register';
  onLoading?: (loading: boolean) => void | undefined;
}

export const SocialAuth: React.FC<SocialAuthProps> = ({ mode, onLoading }) => {
  const handleSocialLogin = async (provider: 'google' | 'github' | 'apple') => {
    try {
      onLoading?.(true);

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        throw error;
      }
    } catch (error: any) {
      toast.error(`Failed to ${mode} with ${provider}. Please try again.`);
      console.error(`Social login error:`, error);
    } finally {
      onLoading?.(false);
    }
  };

  const providers = [
    {
      id: 'google' as const,
      name: 'Google',
      icon: Chrome,
      bgColor: 'bg-white hover:bg-gray-50',
      textColor: 'text-gray-900',
      borderColor: 'border-gray-300',
    },
    {
      id: 'github' as const,
      name: 'GitHub',
      icon: Github,
      bgColor: 'bg-gray-900 hover:bg-gray-800',
      textColor: 'text-white',
      borderColor: 'border-gray-900',
    },
    {
      id: 'apple' as const,
      name: 'Apple',
      icon: Apple,
      bgColor: 'bg-black hover:bg-gray-900',
      textColor: 'text-white',
      borderColor: 'border-black',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {providers.map((provider) => {
          const Icon = provider.icon;
          return (
            <Button
              key={provider.id}
              variant="outline"
              className={`w-full h-11 ${provider.bgColor} ${provider.textColor} ${provider.borderColor} font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]`}
              onClick={() => handleSocialLogin(provider.id)}
            >
              <Icon className="mr-3 h-5 w-5" />
              {mode === 'login' ? 'Sign in' : 'Sign up'} with {provider.name}
            </Button>
          );
        })}
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator className="w-full" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with email
          </span>
        </div>
      </div>
    </div>
  );
};