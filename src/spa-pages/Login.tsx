import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AuthCard } from '@/components/auth/AuthCard';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { useKeyboardShortcuts, createSubmitShortcut } from '@/hooks/useKeyboardShortcuts';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<string>('login');

  const searchParams = new URLSearchParams(location.search);
  const initialTab = searchParams.get('register') === 'true' ? 'register' : 'login';
  const redirectTo = searchParams.get('redirect') || '/';

  // Set initial tab based on URL params
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Keyboard shortcuts
  useKeyboardShortcuts([
    createSubmitShortcut(() => {
      // The form submission is now handled by the individual form components
      const submitButton = document.querySelector('button[type="submit"]') as HTMLButtonElement;
      if (submitButton && !submitButton.disabled) {
        submitButton.click();
      }
    }),
  ]);

  const handleSuccess = () => {
    navigate(redirectTo);
  };

  return (
    <div className='min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-background via-background to-muted/30 relative overflow-hidden'>
      {/* Background decorative elements */}
      <div className='absolute inset-0 overflow-hidden'>
        <div className='absolute -top-1/2 -right-1/2 w-96 h-96 rounded-full bg-gradient-to-br from-primary/5 to-primary/10 blur-3xl' />
        <div className='absolute -bottom-1/2 -left-1/2 w-96 h-96 rounded-full bg-gradient-to-tr from-secondary/5 to-secondary/10 blur-3xl' />
      </div>

      <div className='relative z-10 w-full max-w-md space-y-8'>
        {/* Logo and Title */}
        <div className='text-center space-y-4'>
          <div className='mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg'>
            <img
              src='/lovable-uploads/74d2a052-10a4-495b-b32f-ca692cde2f31.png'
              alt='Commonly logo'
              className='h-10 w-10 object-contain'
            />
          </div>
          <div className='space-y-2'>
            <h1 className='text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent'>
              Welcome to Commonly
            </h1>
            <p className='text-muted-foreground text-lg'>
              {activeTab === 'login'
                ? 'Sign in to continue to your account'
                : 'Create an account to get started'}
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
          <TabsList className='grid w-full grid-cols-2 mb-8 bg-muted/50 backdrop-blur-sm'>
            <TabsTrigger
              value='login'
              className='data-[state=active]:bg-background data-[state=active]:shadow-md transition-all duration-200'
            >
              Sign In
            </TabsTrigger>
            <TabsTrigger
              value='register'
              className='data-[state=active]:bg-background data-[state=active]:shadow-md transition-all duration-200'
            >
              Sign Up
            </TabsTrigger>
          </TabsList>

          {/* Login Tab */}
          <TabsContent value='login' className='space-y-0 animate-in fade-in-50 duration-300'>
            <AuthCard
              title='Sign In'
              description='Enter your email and password to access your account'
            >
              <LoginForm redirectTo={redirectTo} onSuccess={handleSuccess} />
            </AuthCard>
          </TabsContent>

          {/* Register Tab */}
          <TabsContent value='register' className='space-y-0 animate-in fade-in-50 duration-300'>
            <AuthCard
              title='Create Account'
              description='Enter your information to create your account'
            >
              <RegisterForm onSuccess={handleSuccess} />
            </AuthCard>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className='text-center space-y-4'>
          <p className='text-sm text-muted-foreground'>
            By continuing, you agree to Commonly's{' '}
            <Link to='/terms' className='text-primary hover:underline font-medium transition-colors'>
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to='/privacy' className='text-primary hover:underline font-medium transition-colors'>
              Privacy Policy
            </Link>
          </p>

          <p className='text-sm text-muted-foreground'>
            {activeTab === 'login' ? (
              <>
                Don't have an account?{' '}
                <button
                  onClick={() => setActiveTab('register')}
                  className='text-primary hover:underline font-medium transition-colors'
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  onClick={() => setActiveTab('login')}
                  className='text-primary hover:underline font-medium transition-colors'
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
