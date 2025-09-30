import { Mail, Smartphone, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface TwoFactorSetupDialogProps {
  showDialog: boolean;
  onClose: () => void;
  twoFactorStep: 'method' | 'code';
  twoFactorMethod: 'app' | 'email' | 'sms';
  verificationCode: string;
  email: string;
  onMethodSelect: (method: 'app' | 'email' | 'sms') => void;
  onStepBack: () => void;
  onVerify: () => void;
  onCodeChange: (code: string) => void;
}

const TwoFactorSetupDialog = ({
  showDialog,
  onClose,
  twoFactorStep,
  twoFactorMethod,
  verificationCode,
  email,
  onMethodSelect,
  onStepBack,
  onVerify,
  onCodeChange,
}: TwoFactorSetupDialogProps) => {
  return (
    <Dialog open={showDialog} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Setup Two-Factor Authentication</DialogTitle>
          <DialogDescription>
            {twoFactorStep === 'method'
              ? 'Choose your preferred method for two-factor authentication.'
              : 'Enter the verification code to complete setup.'}
          </DialogDescription>
        </DialogHeader>

        {twoFactorStep === 'method' ? (
          <div className='grid gap-4'>
            <Button
              variant='outline'
              className='flex justify-between items-center'
              onClick={() => onMethodSelect('app')}
            >
              <div className='flex items-center'>
                <Smartphone className='mr-2 h-4 w-4' />
                <span>Authenticator App</span>
              </div>
              <span className='text-xs bg-green-100 text-green-800 px-2 py-1 rounded'>
                Recommended
              </span>
            </Button>

            <Button
              variant='outline'
              className='flex items-center justify-start'
              onClick={() => onMethodSelect('email')}
            >
              <Mail className='mr-2 h-4 w-4' />
              <span>Email</span>
            </Button>

            <Button
              variant='outline'
              className='flex items-center justify-start'
              onClick={() => onMethodSelect('sms')}
            >
              <KeyRound className='mr-2 h-4 w-4' />
              <span>SMS</span>
            </Button>
          </div>
        ) : (
          <div className='space-y-4'>
            {twoFactorMethod === 'app' && (
              <div className='bg-secondary/30 p-4 rounded-lg flex flex-col items-center'>
                <div className='bg-white p-2 rounded mb-3'>
                  <div className='bg-black h-40 w-40 grid grid-cols-5 grid-rows-5 gap-1 p-2'>
                    {Array(25)
                      .fill(0)
                      .map((_, i) => (
                        <div
                          key={i}
                          className={`${Math.random() > 0.5 ? 'bg-white' : 'bg-black'}`}
                        ></div>
                      ))}
                  </div>
                </div>
                <p className='text-xs text-center text-muted-foreground'>
                  Scan this QR code with your authenticator app, or enter the code manually:
                  <span className='font-mono font-bold block mt-1 text-sm'>
                    ABCD EFGH IJKL MNOP
                  </span>
                </p>
              </div>
            )}

            {twoFactorMethod === 'email' && (
              <div className='text-center p-4 bg-secondary/30 rounded-lg'>
                <Mail className='h-12 w-12 mx-auto mb-2 text-primary' />
                <p>We've sent a verification code to:</p>
                <p className='font-bold'>{email}</p>
              </div>
            )}

            {twoFactorMethod === 'sms' && (
              <div className='text-center p-4 bg-secondary/30 rounded-lg'>
                <Smartphone className='h-12 w-12 mx-auto mb-2 text-primary' />
                <p>We've sent a verification code to:</p>
                <p className='font-bold'>+1 (555) 123-4567</p>
              </div>
            )}

            <div className='space-y-2'>
              <Label htmlFor='verification-code'>Verification Code</Label>
              <div className='flex justify-center'>
                <InputOTP
                  maxLength={6}
                  value={verificationCode}
                  onChange={onCodeChange}
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
          </div>
        )}

        <DialogFooter>
          {twoFactorStep === 'method' ? (
            <Button variant='ghost' onClick={onClose}>
              Cancel
            </Button>
          ) : (
            <>
              <Button variant='ghost' onClick={onStepBack}>
                Back
              </Button>
              <Button type='submit' onClick={onVerify}>
                Verify
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TwoFactorSetupDialog;
