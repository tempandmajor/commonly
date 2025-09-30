import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Shield, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { User } from '@/types/auth';

interface Secure2FASetupDialogProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const Secure2FASetupDialog = ({ user, isOpen, onClose, onSuccess }: Secure2FASetupDialogProps) => {
  const [step, setStep] = useState<'method' | 'verify'>('method');
  const [method, setMethod] = useState<'app' | 'email'>('app');
  const [verificationCode, setVerificationCode] = useState('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleMethodSelect = async (selectedMethod: 'app' | 'email') => {
    if (!user?.id) {
      toast.error('User authentication required');
      return;
    }

    setLoading(true);
    setMethod(selectedMethod);

    try {
      const { data, error } = await supabase.functions.invoke('setup-2fa', {
        body: {
          email: user.email,
          type: selectedMethod === 'app' ? 'totp' : 'email',
        },
      });

      if (error) throw error;

      if (selectedMethod === 'app' && data) {
        // Safely handle QR code data - no direct HTML injection
        setQrCodeDataUrl(data.qrCode);
        setSecret(data.secret);
        setBackupCodes(data.backupCodes || []);
      }

      setStep('verify');
    } catch (error) {
      console.error('2FA setup error:', error);
      toast.error('Failed to setup 2FA. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async () => {
    if (!user?.id) {
      toast.error('User authentication required');
      return;
    }

    if (method === 'app' && verificationCode.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('verify-2fa-setup', {
        body: {
          secret,
          code: verificationCode,
          email: user.email,
        },
      });

      if (error) throw error;

      if (data?.verified) {
        toast.success('Two-factor authentication enabled successfully');
        onSuccess();
        onClose();
      } else {
        toast.error('Invalid verification code. Please try again.');
      }
    } catch (error) {
      console.error('2FA verification error:', error);
      toast.error('Failed to verify 2FA code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetDialog = () => {
    setStep('method');
    setMethod('app');
    setVerificationCode('');
    setQrCodeDataUrl('');
    setSecret('');
    setBackupCodes([]);
  };

  const handleClose = () => {
    resetDialog();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Shield className='h-5 w-5' />
            Setup Two-Factor Authentication
          </DialogTitle>
        </DialogHeader>

        {step === 'method' && (
          <div className='space-y-4'>
            <Alert>
              <AlertTriangle className='h-4 w-4' />
              <AlertDescription>
                Two-factor authentication adds an extra layer of security to your account.
              </AlertDescription>
            </Alert>

            <div className='space-y-3'>
              <Button
                variant='outline'
                className='w-full h-auto p-4 text-left'
                onClick={() => handleMethodSelect('app')}
                disabled={loading}
              >
                <div>
                  <div className='font-medium'>Authenticator App (Recommended)</div>
                  <div className='text-sm text-muted-foreground'>
                    Use Google Authenticator, Authy, or similar apps
                  </div>
                </div>
              </Button>

              <Button
                variant='outline'
                className='w-full h-auto p-4 text-left'
                onClick={() => handleMethodSelect('email')}
                disabled={loading}
              >
                <div>
                  <div className='font-medium'>Email Verification</div>
                  <div className='text-sm text-muted-foreground'>Receive codes via email</div>
                </div>
              </Button>
            </div>
          </div>
        )}

        {step === 'verify' && method === 'app' && (
          <div className='space-y-4'>
            <div className='text-center'>
              <h3 className='font-medium mb-2'>Scan QR Code</h3>
              <p className='text-sm text-muted-foreground mb-4'>
                Scan this QR code with your authenticator app
              </p>

              {qrCodeDataUrl && (
                <div
                  className='flex justify-center mb-4'
                  dangerouslySetInnerHTML={{ __html: qrCodeDataUrl }}
                />
              )}

              <div className='bg-muted p-3 rounded text-xs font-mono break-all'>
                Manual entry key: {secret}
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='verification-code'>Enter verification code</Label>
              <Input
                id='verification-code'
                type='text'
                placeholder='000000'
                value={verificationCode}
                onChange={e => setVerificationCode((e.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
              />
            </div>

            {backupCodes.length > 0 && (
              <Alert>
                <CheckCircle2 className='h-4 w-4' />
                <AlertDescription>
                  <div className='font-medium mb-2'>Save these backup codes:</div>
                  <div className='grid grid-cols-2 gap-1 text-xs font-mono'>
                    {backupCodes.map((code, index) => (
                      <div key={index} className='bg-background p-1 rounded'>
                        {code}
                      </div>
                    ))}
                  </div>
                  <div className='text-xs mt-2'>
                    Store these codes safely. You can use them to access your account if you lose
                    your authenticator device.
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className='flex gap-2'>
              <Button variant='outline' onClick={() => setStep('method')} className='flex-1'>
                Back
              </Button>
              <Button
                onClick={handleVerification}
                disabled={loading || verificationCode.length !== 6}
                className='flex-1'
              >
                {loading ? 'Verifying...' : 'Verify & Enable'}
              </Button>
            </div>
          </div>
        )}

        {step === 'verify' && method === 'email' && (
          <div className='space-y-4'>
            <Alert>
              <CheckCircle2 className='h-4 w-4' />
              <AlertDescription>
                Email-based 2FA has been enabled. You'll receive verification codes via email when
                logging in.
              </AlertDescription>
            </Alert>

            <Button onClick={handleClose} className='w-full'>
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default Secure2FASetupDialog;
