import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { authAPI } from '@/services/auth';
import { Shield, Smartphone, Mail, Download, Check, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface TwoFactorSetupProps {
  userEmail: string;
  onSetupComplete: () => void;
  className?: string | undefined;
}

const TwoFactorSetup = ({ userEmail, onSetupComplete, className = '' }: TwoFactorSetupProps) => {
  const [step, setStep] = useState<'choose' | 'setup-totp' | 'verify-totp' | 'backup-codes'>(
    'choose'
  );
  const [setupData, setSetupData] = useState<{
    qrCode: string;
    secret: string;
    backupCodes: string[];
  } | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [downloadedCodes, setDownloadedCodes] = useState(false);

  const handleSetupTOTP = async () => {
    try {
      setIsLoading(true);
      const data = await authAPI.setupTwoFactor({
        email: userEmail,
        type: 'totp',
      });
      setSetupData(data);
      setStep('setup-totp');
    } catch (error) {
      toast.error('Failed to setup 2FA. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetupEmail = async () => {
    try {
      setIsLoading(true);
      await authAPI.sendEmailVerification();
      toast.success('2FA email verification has been enabled for your account.');
      onSetupComplete();
    } catch (error) {
      toast.error('Failed to setup email 2FA. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyTOTP = async () => {
    if (!setupData || verificationCode.length !== 6) return;

    try {
      setIsLoading(true);
      const verified = await authAPI.verifyTwoFactorSetup({
        email: userEmail,
        secret: setupData.secret,
        code: verificationCode,
      });

      if (verified) {
        setStep('backup-codes');
        toast.success('2FA setup successful!');
      } else {
        toast.error('Invalid code. Please check your authenticator app and try again.');
      }
    } catch (error) {
      toast.error('Failed to verify code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadBackupCodes = () => {
    if (!setupData?.backupCodes) return;

    const content = `2FA Backup Codes for CommonlyApp
Generated: ${new Date().toLocaleDateString()}

IMPORTANT: Save these codes in a secure location. Each code can only be used once.

${setupData.backupCodes.map((code, index) => `${index + 1}. ${code}`).join('\n')}

If you lose access to your authenticator app, you can use these codes to regain access to your account.`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `commonlyapp-backup-codes-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloadedCodes(true);
  };

  const handleFinishSetup = () => {
    if (!downloadedCodes) {
      toast.error('Please download your backup codes before continuing.');
      return;
    }
    onSetupComplete();
  };

  return (
    <div className={className}>
      {step === 'choose' && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Shield className='h-5 w-5' />
              Enable Two-Factor Authentication
            </CardTitle>
            <CardDescription>Add an extra layer of security to your account</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='space-y-3'>
              <Button
                onClick={handleSetupTOTP}
                className='w-full justify-start'
                variant='outline'
                disabled={isLoading}
              >
                <Smartphone className='mr-2 h-4 w-4' />
                <div className='text-left'>
                  <div className='font-medium'>Authenticator App</div>
                  <div className='text-sm text-muted-foreground'>
                    Use apps like Google Authenticator, Authy, or 1Password
                  </div>
                </div>
                <Badge variant="secondary" className="ml-auto">
                  Recommended
                </Badge>
              </Button>

              <Button
                onClick={handleSetupEmail}
                className='w-full justify-start'
                variant='outline'
                disabled={isLoading}
              >
                <Mail className='mr-2 h-4 w-4' />
                <div className='text-left'>
                  <div className='font-medium'>Email Verification</div>
                  <div className='text-sm text-muted-foreground'>
                    Receive verification codes via email
                  </div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'setup-totp' && setupData && (
        <Card>
          <CardHeader>
            <CardTitle>Setup Authenticator App</CardTitle>
            <CardDescription>Scan the QR code with your authenticator app</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='flex justify-center'>
              <div
                className='p-4 bg-white rounded-lg border'
                dangerouslySetInnerHTML={{ __html: setupData.qrCode }}
              />
            </div>

            <div className='space-y-2'>
              <Label>Manual Entry Key</Label>
              <Input
                value={setupData.secret}
                readOnly
                className='font-mono text-sm'
                onClick={e => {
                  e.currentTarget.select();
                  navigator.clipboard.writeText(setupData.secret);
                  toast.success('Secret copied to clipboard');
                }}
              />
              <p className='text-xs text-muted-foreground'>
                Click to copy the secret key if you can't scan the QR code
              </p>
            </div>

            <div className='space-y-2'>
              <Label>Enter Verification Code</Label>
              <p className='text-sm text-muted-foreground'>
                Enter the 6-digit code from your authenticator app
              </p>
              <div className='flex justify-center'>
                <InputOTP
                  maxLength={6}
                  value={verificationCode}
                  onChange={setVerificationCode}
                  render={({ slots }) => (
                    <InputOTPGroup>
                      {slots.map((slot, index) => (
                        <InputOTPSlot key={index} {...slot} index={index} />
                      ))}
                    </InputOTPGroup>
                  )}
                />
              </div>
            </div>

            <div className='flex gap-2 pt-4'>
              <Button variant='outline' onClick={() => setStep('choose')} disabled={isLoading}>
                Back
              </Button>
              <Button
                onClick={handleVerifyTOTP}
                disabled={isLoading || verificationCode.length !== 6}
                className='flex-1'
              >
                {isLoading ? 'Verifying...' : 'Verify & Continue'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'backup-codes' && setupData && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <AlertTriangle className='h-5 w-5 text-amber-500' />
              Save Your Backup Codes
            </CardTitle>
            <CardDescription>
              These codes can be used if you lose access to your authenticator app
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='bg-muted p-4 rounded-lg'>
              <div className='grid grid-cols-2 gap-2 font-mono text-sm'>
                {setupData.backupCodes.map((code, index) => (
                  <div key={index} className='flex items-center gap-2'>
                    <span className='text-muted-foreground'>{index + 1}.</span>
                    <span>{code}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className='space-y-3'>
              <Button
                onClick={downloadBackupCodes}
                variant='outline'
                className='w-full'
                disabled={downloadedCodes}
              >
                {downloadedCodes ? (
                  <>
                    <Check className='mr-2 h-4 w-4 text-green-500' />
                    Codes Downloaded
                  </>
                ) : (
                  <>
                    <Download className='mr-2 h-4 w-4' />
                    Download Backup Codes
                  </>
                )}
              </Button>

              <div className='bg-amber-50 border border-amber-200 p-3 rounded-lg'>
                <p className='text-sm text-amber-800'>
                  <strong>Important:</strong> Store these codes in a secure location. Each code can
                  only be used once and they're the only way to access your account if you lose your
                  authenticator app.
                </p>
              </div>

              <Button onClick={handleFinishSetup} className='w-full' disabled={!downloadedCodes}>
                Complete Setup
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TwoFactorSetup;
