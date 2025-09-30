import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import {
  Send,
  CreditCard,
  DollarSign,
  User,
  Mail,
  Hash,
  QrCode,
  Info,
  AlertTriangle,
  Zap,
  Clock,
  Calendar,
  Gift,
  Eye,
  EyeOff,
  Users,
  Plus,
  Lock,
  Check,
} from 'lucide-react';
import {
  FormField,
  FormSection,
  FormActions,
  DatePicker,
} from '@/components/forms/shared';
import { SearchSelect } from '@/components/forms/shared/SearchSelect';
import {
  creditTransferSchema,
  fundsTransferSchema,
  combinedTransferSchema,
  bulkTransferSchema,
  CreditTransferFormValues,
  FundsTransferFormValues,
  CombinedTransferFormValues,
  BulkTransferFormValues,
  creditTransferDefaults,
  fundsTransferDefaults,
  calculateTransferFee,
  validateRecipient,
  transferMethods,
} from '@/lib/validations/transferValidation';
import { useKeyboardShortcuts, createCancelShortcut } from '@/hooks/useKeyboardShortcuts';
import { useWallet } from '@/hooks/useWallet';
import { usePromotionCredits } from '@/hooks/usePromotionCredits';

interface TransferModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType?: 'credits' | 'funds' | 'both' | undefined;
  defaultRecipient?: {
    method?: string | undefined;
    identifier: string;
    displayName?: string | undefined;
  } | undefined;
  maxAmount?: number | undefined;
  onSuccess?: ((transferId: string) => void) | undefined;
}

type TransferFormValues = Partial<CreditTransferFormValues> | Partial<FundsTransferFormValues> | Partial<CombinedTransferFormValues> | Partial<BulkTransferFormValues>;

const TransferModal: React.FC<TransferModalProps> = ({
  open,
  onOpenChange,
  defaultType = 'funds',
  defaultRecipient,
  maxAmount: _maxAmount,
  onSuccess,
}) => {
  const [transferType, setTransferType] = useState<'credits' | 'funds' | 'both' | 'bulk'>(
    defaultType === 'both' ? 'both' : defaultType
  );
  const [recipientValidated, setRecipientValidated] = useState(false);
  const [recipientInfo, setRecipientInfo] = useState<{
    userId?: string | undefined;
    displayName?: string | undefined;
    avatar?: string | undefined;
  }>({});
  const [showPin, setShowPin] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const wallet = useWallet();
  const { creditSummary } = usePromotionCredits();

  // Keyboard shortcuts
  useKeyboardShortcuts([createCancelShortcut(() => onOpenChange(false))]);

  // Get form schema based on transfer type
  const getFormSchema = () => {
    switch (transferType) {
      case 'credits':
        return creditTransferSchema;
      case 'funds':
        return fundsTransferSchema;
      case 'both':
        return combinedTransferSchema;
      case 'bulk':
        return bulkTransferSchema;
    }
  };

  const getFormDefaults = (): TransferFormValues => {
    const base = transferType === 'credits' ? { ...creditTransferDefaults } : { ...fundsTransferDefaults };

    if (defaultRecipient) {
      const method = defaultRecipient.method ?? base.recipientMethod;
      return {
        ...base,
        recipientMethod: method as 'email' | 'username' | 'userId' | 'qrCode' | undefined,
        recipientIdentifier: defaultRecipient.identifier,
      } as TransferFormValues;
    }

    return base as TransferFormValues;
  };

  const form = useForm<TransferFormValues>({
    resolver: zodResolver(getFormSchema()) as any,
    defaultValues: getFormDefaults(),
  });

  // Watch for fee calculation
  const amount = form.watch('amount' as any) as number | undefined;
  const transferSpeed = form.watch('transferSpeed' as any) as 'instant' | 'standard' | 'scheduled' | undefined;
  const includeFees = form.watch('includeFees' as any) as boolean | undefined;

  // Calculate fees
  useEffect(() => {
    if (transferType === 'funds' || transferType === 'both') {
      const fee = calculateTransferFee(amount || 0, transferSpeed || 'instant');
      form.setValue('feeAmount' as any, fee);

      const total = includeFees ? (amount || 0) + fee : amount || 0;
      form.setValue('totalAmount' as any, total);
    }
  }, [amount, transferSpeed, includeFees, transferType]);

  // Validate recipient
  const handleRecipientBlur = async () => {
    const method = form.getValues('recipientMethod' as any) as string | undefined;
    const identifier = form.getValues('recipientIdentifier' as any) as string | undefined;

    if (method && identifier) {
      const result = await validateRecipient(method, identifier);

      if (result.isValid) {
        setRecipientValidated(true);
        setRecipientInfo({
          userId: result.userId ?? undefined,
          displayName: result.displayName ?? undefined,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${result.userId}`,
        });
      } else {
        setRecipientValidated(false);
        form.setError('recipientIdentifier' as any, {
          type: 'manual',
          message: result.error ?? 'Invalid recipient',
        });
      }
    }
  };

  const handleSubmit = async (values: TransferFormValues) => {
    try {
      setIsProcessing(true);

      // Check if PIN is required
      const requiresPin = (amount ?? 0) > 100; // Example threshold
      if (requiresPin && !(values as any).pin) {
        setShowPin(true);
        setIsProcessing(false);
        return;
      }

      // Mock transfer processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      const transferId = `TRF${Date.now()}`;

      toast.success(
        `Transfer successful! ${
          transferType === 'credits' ? `${amount} credits sent` : `$${amount} sent`
        } to ${recipientInfo.displayName || (values as any).recipientIdentifier}`
      );

      if (onSuccess) {
        onSuccess(transferId);
      }

      onOpenChange(false);
      form.reset();
    } catch (error) {
      toast.error('Transfer failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };


  const recipientMethodOptions = transferMethods.map(method => ({
    value: method,
    label:
      method === 'userId'
        ? 'User ID'
        : method === 'qrCode'
          ? 'QR Code'
          : method.charAt(0).toUpperCase() + method.slice(1),
  }));

  const recipientMethod = form.watch('recipientMethod' as any) as string | undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[600px] max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Send Money</DialogTitle>
          <DialogDescription>Transfer funds or credits to another user</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit as any)} className='space-y-6'>
            {/* Transfer Type Selection */}
            <div className='space-y-3'>
              <Label>What would you like to send?</Label>
              <div className='grid grid-cols-4 gap-2'>
                <Button
                  type='button'
                  variant={transferType === 'funds' ? 'default' : 'outline'}
                  size='sm'
                  onClick={() => setTransferType('funds')}
                  className='flex flex-col gap-1 h-auto py-3'
                >
                  <DollarSign className='h-4 w-4' />
                  <span className='text-xs'>Funds</span>
                </Button>
                <Button
                  type='button'
                  variant={transferType === 'credits' ? 'default' : 'outline'}
                  size='sm'
                  onClick={() => setTransferType('credits')}
                  className='flex flex-col gap-1 h-auto py-3'
                >
                  <CreditCard className='h-4 w-4' />
                  <span className='text-xs'>Credits</span>
                </Button>
                <Button
                  type='button'
                  variant={transferType === 'both' ? 'default' : 'outline'}
                  size='sm'
                  onClick={() => setTransferType('both')}
                  className='flex flex-col gap-1 h-auto py-3'
                >
                  <Plus className='h-4 w-4' />
                  <span className='text-xs'>Both</span>
                </Button>
                <Button
                  type='button'
                  variant={transferType === 'bulk' ? 'default' : 'outline'}
                  size='sm'
                  onClick={() => setTransferType('bulk')}
                  className='flex flex-col gap-1 h-auto py-3'
                >
                  <Users className='h-4 w-4' />
                  <span className='text-xs'>Bulk</span>
                </Button>
              </div>
            </div>

            {/* Balance Display */}
            <Alert>
              <Info className='h-4 w-4' />
              <AlertDescription>
                <div className='flex justify-between items-center'>
                  <span>Available balance:</span>
                  <div className='flex gap-4'>
                    <span className='font-medium'>${(wallet.balance / 100).toFixed(2)} funds</span>
                    <span className='font-medium'>{creditSummary.available} credits</span>
                  </div>
                </div>
              </AlertDescription>
            </Alert>

            {transferType !== 'bulk' ? (
              <>
                {/* Recipient Selection */}
                <FormSection title='Recipient' description='Who are you sending to?'>
                  <div className='space-y-4'>
                    <div className='space-y-2'>
                      <Label htmlFor='recipientMethod'>Send via</Label>
                      <SearchSelect
                        options={recipientMethodOptions}
                        value={recipientMethod}
                        onChange={(value) => form.setValue('recipientMethod' as any, value)}
                        placeholder='Select method...'
                      />
                    </div>

                    <div className='space-y-2'>
                      <FormField
                        form={form}
                        name='recipientIdentifier'
                        label={
                          recipientMethod === 'email'
                            ? 'Email Address'
                            : recipientMethod === 'username'
                              ? 'Username'
                              : recipientMethod === 'userId'
                                ? 'User ID'
                                : 'Scan QR Code'
                        }
                        placeholder={
                          recipientMethod === 'email'
                            ? 'user@example.com'
                            : recipientMethod === 'username'
                              ? '@username'
                              : recipientMethod === 'userId'
                                ? 'usr_123...'
                                : 'Scan or enter code'
                        }
                        required
                        icon={
                          recipientMethod === 'email' ? (
                            <Mail className='h-4 w-4' />
                          ) : recipientMethod === 'username' ? (
                            <User className='h-4 w-4' />
                          ) : recipientMethod === 'userId' ? (
                            <Hash className='h-4 w-4' />
                          ) : (
                            <QrCode className='h-4 w-4' />
                          )
                        }
                        onChange={handleRecipientBlur}
                      />

                      {recipientValidated && recipientInfo.displayName && (
                        <div className='flex items-center gap-3 p-3 bg-muted rounded-lg'>
                          <Avatar className='h-10 w-10'>
                            <AvatarImage src={recipientInfo.avatar} />
                            <AvatarFallback>
                              {recipientInfo.displayName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className='flex-1'>
                            <p className='font-medium'>{recipientInfo.displayName}</p>
                            <p className='text-sm text-muted-foreground'>Verified recipient</p>
                          </div>
                          <Check className='h-5 w-5 text-green-500' />
                        </div>
                      )}
                    </div>
                  </div>
                </FormSection>

                {/* Amount Section */}
                <FormSection title='Amount' description='How much would you like to send?'>
                  <div className='space-y-4'>
                    {transferType === 'both' ? (
                      <>
                        <FormField
                          form={form}
                          name='creditAmount'
                          label='Credits'
                          type='number'
                          placeholder='0'
                          icon={<CreditCard className='h-4 w-4' />}
                        />
                        <FormField
                          form={form}
                          name='fundsAmount'
                          label='Funds'
                          type='number'
                          placeholder='0.00'
                          icon={<DollarSign className='h-4 w-4' />}
                        />
                      </>
                    ) : (
                      <>
                        <FormField
                          form={form}
                          name='amount'
                          label='Amount'
                          type='number'
                          placeholder={transferType === 'credits' ? '0' : '0.00'}
                          required
                          icon={
                            transferType === 'credits' ? (
                              <CreditCard className='h-4 w-4' />
                            ) : (
                              <DollarSign className='h-4 w-4' />
                            )
                          }
                        />

                        <FormField
                          form={form}
                          name='confirmAmount'
                          label='Confirm Amount'
                          type='number'
                          placeholder={transferType === 'credits' ? '0' : '0.00'}
                          required
                          description='Re-enter the amount to confirm'
                        />
                      </>
                    )}

                    {/* Quick amount buttons */}
                    <div className='flex gap-2'>
                      <Label className='text-sm'>Quick amounts:</Label>
                      <div className='flex gap-1'>
                        {[10, 25, 50, 100].map(amt => (
                          <Button
                            key={amt}
                            type='button'
                            variant='outline'
                            size='sm'
                            onClick={() => {
                              form.setValue('amount' as any, amt);
                              form.setValue('confirmAmount' as any, amt);
                            }}
                          >
                            ${amt}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </FormSection>

                {/* Transfer Options */}
                {((transferType === 'funds' || transferType === 'both')) && (
                  <FormSection title='Transfer Options' description='Customize your transfer'>
                    <div className='space-y-4'>
                      <div className='space-y-3'>
                        <Label>Transfer Speed</Label>
                        <RadioGroup
                          value={transferSpeed || 'instant'}
                          onValueChange={value => form.setValue('transferSpeed' as any, value)}
                        >
                          <div className='flex items-center space-x-3 p-3 border rounded-lg'>
                            <RadioGroupItem value='instant' id='instant' />
                            <Label htmlFor='instant' className='flex-1 cursor-pointer'>
                              <div className='flex items-center justify-between'>
                                <div className='flex items-center gap-2'>
                                  <Zap className='h-4 w-4 text-yellow-500' />
                                  <span>Instant</span>
                                </div>
                                <span className='text-sm text-muted-foreground'>
                                  Fee: ${calculateTransferFee(amount || 0, 'instant').toFixed(2)}
                                </span>
                              </div>
                              <p className='text-xs text-muted-foreground mt-1'>
                                Arrives within seconds
                              </p>
                            </Label>
                          </div>
                          <div className='flex items-center space-x-3 p-3 border rounded-lg'>
                            <RadioGroupItem value='standard' id='standard' />
                            <Label htmlFor='standard' className='flex-1 cursor-pointer'>
                              <div className='flex items-center justify-between'>
                                <div className='flex items-center gap-2'>
                                  <Clock className='h-4 w-4 text-blue-500' />
                                  <span>Standard</span>
                                </div>
                                <span className='text-sm text-muted-foreground'>Free</span>
                              </div>
                              <p className='text-xs text-muted-foreground mt-1'>
                                Arrives in 1-3 business days
                              </p>
                            </Label>
                          </div>
                          <div className='flex items-center space-x-3 p-3 border rounded-lg'>
                            <RadioGroupItem value='scheduled' id='scheduled' />
                            <Label htmlFor='scheduled' className='flex-1 cursor-pointer'>
                              <div className='flex items-center justify-between'>
                                <div className='flex items-center gap-2'>
                                  <Calendar className='h-4 w-4 text-green-500' />
                                  <span>Scheduled</span>
                                </div>
                                <span className='text-sm text-muted-foreground'>Free</span>
                              </div>
                              <p className='text-xs text-muted-foreground mt-1'>
                                Send on a specific date
                              </p>
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>

                      {transferSpeed === 'scheduled' && (
                        <div className='space-y-2'>
                          <Label htmlFor='scheduledDate'>Schedule Date *</Label>
                          <DatePicker
                            value={form.watch('scheduledDate' as any) as Date | undefined}
                            onChange={(date) => form.setValue('scheduledDate' as any, date)}
                            placeholder='Select date'
                            minDate={new Date()}
                          />
                        </div>
                      )}
                    </div>
                  </FormSection>
                )}

                {/* Additional Details */}
                <FormSection
                  title='Additional Details'
                  description='Add a note or make it special'
                  collapsible
                >
                  <div className='space-y-4'>
                    <FormField
                      form={form}
                      name='description'
                      label='Description'
                      type='textarea'
                      placeholder="What's this transfer for?"
                    />

                    <FormField
                      form={form}
                      name='note'
                      label='Private Note'
                      placeholder='Add a note for the recipient'
                      description='The recipient will see this note'
                    />

                    <div className='space-y-3'>
                      <FormField
                        form={form}
                        name='isGift'
                        label='Mark as gift'
                        type='switch'
                        description='Add gift wrapping to the transfer notification'
                        icon={<Gift className='h-4 w-4' />}
                      />

                      <FormField
                        form={form}
                        name='isAnonymous'
                        label='Send anonymously'
                        type='switch'
                        description='Hide your identity from the recipient'
                        icon={
                          form.watch('isAnonymous' as any) ? (
                            <EyeOff className='h-4 w-4' />
                          ) : (
                            <Eye className='h-4 w-4' />
                          )
                        }
                      />
                    </div>
                  </div>
                </FormSection>
              </>
            ) : (
              /* Bulk Transfer Section */
              <FormSection title='Bulk Transfer' description='Send to multiple recipients at once'>
                <Alert>
                  <AlertTriangle className='h-4 w-4' />
                  <AlertDescription>
                    Bulk transfer feature coming soon! You can send to multiple recipients in one
                    transaction.
                  </AlertDescription>
                </Alert>
              </FormSection>
            )}

            {/* Summary */}
            {transferType !== 'bulk' && amount && amount > 0 && (
              <FormSection title='Summary' description='Review your transfer'>
                <div className='space-y-3 text-sm'>
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>Amount</span>
                    <span className='font-medium'>
                      {transferType === 'credits' ? `${amount} credits` : `$${amount.toFixed(2)}`}
                    </span>
                  </div>

                  {((transferType === 'funds' || transferType === 'both') && includeFees) && (
                    <>
                      <div className='flex justify-between'>
                        <span className='text-muted-foreground'>Transfer fee</span>
                        <span>${(form.watch('feeAmount' as any) as number | undefined)?.toFixed(2) || '0.00'}</span>
                      </div>
                      <Separator />
                      <div className='flex justify-between font-semibold'>
                        <span>Total to send</span>
                        <span>${(form.watch('totalAmount' as any) as number | undefined)?.toFixed(2) || '0.00'}</span>
                      </div>
                    </>
                  )}

                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>To</span>
                    <span className='font-medium'>
                      {recipientInfo.displayName ||
                        (form.watch('recipientIdentifier' as any) as string | undefined) ||
                        'Not specified'}
                    </span>
                  </div>

                  {transferSpeed === 'scheduled' && (
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground'>Scheduled for</span>
                      <span>
                        {(form.watch('scheduledDate' as any) as Date | undefined)?.toLocaleDateString() || 'Not set'}
                      </span>
                    </div>
                  )}
                </div>
              </FormSection>
            )}

            {/* PIN Entry */}
            {showPin && (
              <Alert>
                <Lock className='h-4 w-4' />
                <AlertDescription>
                  <div className='space-y-3 mt-2'>
                    <p>This transfer requires your PIN for security.</p>
                    <FormField
                      form={form}
                      name='pin'
                      label='Enter PIN'
                      type='password'
                      placeholder='••••'
                      required
                    />
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <FormActions
                isSubmitting={isProcessing}
                isDisabled={!recipientValidated && transferType !== 'bulk'}
                submitLabel={
                  transferType === 'bulk'
                    ? 'Send to Multiple'
                    : transferType === 'credits'
                      ? `Send ${amount || 0} Credits`
                      : `Send $${(form.watch('totalAmount' as any) as number | undefined)?.toFixed(2) || '0.00'}`
                }
                submitIcon={<Send className='h-4 w-4' />}
                showCancel={true}
                onCancel={() => onOpenChange(false)}
                cancelLabel='Cancel'
              />
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default TransferModal;
