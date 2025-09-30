import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import TwoFactorSetupDialog from './TwoFactorSetupDialog';
import { User } from '@/types/auth';

interface TwoFactorDialogWrapperProps {
  user: User | null;
  showDialog: boolean;
  onClose: () => void;
  twoFactorStep: 'method' | 'code';
  twoFactorMethod: 'app' | 'email' | 'sms';
  verificationCode: string;
  email: string;
  onMethodSelect: (method: 'app' | 'email' | 'sms') => void;
  onStepBack: () => void;
  setTwoFactorEnabled: (enabled: boolean) => void;
  onCodeChange: (code: string) => void;
}

const TwoFactorDialogWrapper = ({
  user,
  showDialog,
  onClose,
  twoFactorStep,
  twoFactorMethod,
  verificationCode,
  email,
  onMethodSelect,
  onStepBack,
  setTwoFactorEnabled,
  onCodeChange,
}: TwoFactorDialogWrapperProps) => {
  const handleVerify = async () => {
    if (!user?.id) {
      toast.error('User authentication required');
      return;
    }

    if (verificationCode.length !== 6) {
      toast.error('Please enter a valid 6-digit verification code');
      return;
    }

    try {
      const { error } = await supabase
        .from('users')
        .update({
          preferences: {
            twoFactorEnabled: true,
            twoFactorMethod: twoFactorMethod,
          },
        })
        .eq('id', user.id);

      if (error) throw error;

      setTwoFactorEnabled(true);
      onClose();
      toast.success('Two-factor authentication enabled successfully');
    } catch (error) {
      toast.error('Failed to enable two-factor authentication');
    }
  };

  return (
    <TwoFactorSetupDialog
      showDialog={showDialog}
      onClose={onClose}
      twoFactorStep={twoFactorStep}
      twoFactorMethod={twoFactorMethod}
      verificationCode={verificationCode}
      email={email}
      onMethodSelect={onMethodSelect}
      onStepBack={onStepBack}
      onVerify={handleVerify}
      onCodeChange={onCodeChange}
    />
  );
};

export default TwoFactorDialogWrapper;
