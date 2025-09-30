import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import Secure2FASetupDialog from './security/Secure2FASetupDialog';
import { User } from '@/types/auth';

interface SecuritySectionProps {
  user?: User | undefined;
}

const SecuritySection = ({ user }: SecuritySectionProps) => {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorType, setTwoFactorType] = useState<string>('none');
  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.id) {
      checkTwoFactorStatus();
    }
  }, [user?.id]);

  const checkTwoFactorStatus = async () => {
    if (!user?.id) return;

    try {
      const { data: twoFactorData } = await supabase
        .from('user_2fa_settings')
        .select('is_enabled, type')
        .eq('user_id', user.id)
        .single();

      if (twoFactorData) {
        setTwoFactorEnabled(twoFactorData.is_enabled);
        setTwoFactorType(twoFactorData.type || 'none');
      }
    } catch (error) {
      console.error('Error checking 2FA status:', error);
    }
  };

  const handleToggleTwoFactor = async () => {
    if (!user?.id) {
      toast.error('User authentication required');
      return;
    }

    if (twoFactorEnabled) {
      // Disable 2FA
      setLoading(true);
      try {
        const { error } = await supabase
          .from('user_2fa_settings')
          .update({ is_enabled: false })
          .eq('user_id', user.id);

        if (error) throw error;

        setTwoFactorEnabled(false);
        setTwoFactorType('none');
        toast.success('Two-factor authentication disabled');
      } catch (error) {
        console.error('Error disabling 2FA:', error);
        toast.error('Failed to disable 2FA');
      } finally {
        setLoading(false);
      }
    } else {
      // Enable 2FA - show setup dialog
      setShowSetupDialog(true);
    }
  };

  const handleSetupSuccess = () => {
    setTwoFactorEnabled(true);
    checkTwoFactorStatus();
  };
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Shield className='h-5 w-5' />
            Security Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-6'>
            <div className='flex items-center justify-between'>
              <div className='space-y-1'>
                <div className='flex items-center gap-2'>
                  <h4 className='font-medium'>Two-Factor Authentication</h4>
                  {twoFactorEnabled ? (
                    <Badge variant='secondary' className='bg-green-100 text-green-800'>
                      <CheckCircle2 className='h-3 w-3 mr-1' />
                      Enabled
                    </Badge>
                  ) : (
                    <Badge variant='outline' className='text-amber-600'>
                      <AlertTriangle className='h-3 w-3 mr-1' />
                      Disabled
                    </Badge>
                  )}
                </div>
                <p className='text-sm text-muted-foreground'>
                  Add an extra layer of security to your account
                  {twoFactorEnabled && twoFactorType !== 'none' && (
                    <span className='block'>
                      Current method: {twoFactorType === 'totp' ? 'Authenticator App' : 'Email'}
                    </span>
                  )}
                </p>
              </div>
              <Button
                onClick={handleToggleTwoFactor}
                disabled={loading}
                variant={twoFactorEnabled ? 'outline' : 'default'}
              >
                {loading ? 'Processing...' : twoFactorEnabled ? 'Disable' : 'Enable'}
              </Button>
            </div>

            <div className='border-t pt-4'>
              <div className='space-y-2'>
                <h4 className='font-medium text-sm'>Security Recommendations</h4>
                <ul className='text-sm text-muted-foreground space-y-1'>
                  <li>• Use a strong, unique password</li>
                  <li>• Enable two-factor authentication</li>
                  <li>• Regularly review your account activity</li>
                  <li>• Keep your recovery information up to date</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Secure2FASetupDialog
        user={user}
        isOpen={showSetupDialog}
        onClose={() => setShowSetupDialog(false)}
        onSuccess={handleSetupSuccess}
      />
    </>
  );
};

export default SecuritySection;
