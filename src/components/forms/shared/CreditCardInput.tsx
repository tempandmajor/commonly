import React, { useState, useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreditCard, Lock, AlertCircle } from 'lucide-react';
import { formatCardNumber, getCardType } from '@/lib/validations/checkoutValidation';

interface CreditCardInputProps {
  form: UseFormReturn<any>;
  className?: string | undefined;
  disabled?: boolean | undefined;
}

const cardIcons: Record<string, React.ReactNode> = {
  visa: (
    <svg className='h-8 w-12' viewBox='0 0 48 32'>
      <rect width='48' height='32' rx='4' fill='#1A1F71' />
      <path d='M16 22h-2.5l1.5-10h2.5l-1.5 10zm7-10l-2.5 10h-2.5l2.5-10h2.5z' fill='white' />
    </svg>
  ),
  mastercard: (
    <svg className='h-8 w-12' viewBox='0 0 48 32'>
      <rect width='48' height='32' rx='4' fill='#EB001B' />
      <circle cx='19' cy='16' r='8' fill='#FF5F00' />
      <circle cx='29' cy='16' r='8' fill='#F79E1B' />
    </svg>
  ),
  amex: (
    <svg className='h-8 w-12' viewBox='0 0 48 32'>
      <rect width='48' height='32' rx='4' fill='#2E77BB' />
      <text x='24' y='20' textAnchor='middle' fill='white' fontSize='10' fontWeight='bold'>
        AMEX
      </text>
    </svg>
  ),
  discover: (
    <svg className='h-8 w-12' viewBox='0 0 48 32'>
      <rect width='48' height='32' rx='4' fill='#FF6000' />
      <text x='24' y='20' textAnchor='middle' fill='white' fontSize='8' fontWeight='bold'>
        DISCOVER
      </text>
    </svg>
  ),
};

export const CreditCardInput: React.FC<CreditCardInputProps> = ({
  form,
  className,
  disabled = false,
}) => {
  const [cardType, setCardType] = useState('unknown');
  const [isFlipped, setIsFlipped] = useState(false);

  const cardNumber = form.watch('newCard.cardNumber') || '';
  const expiryMonth = form.watch('newCard.expiryMonth') || '';
  const expiryYear = form.watch('newCard.expiryYear') || '';
  const cvv = form.watch('newCard.cvv') || '';

  useEffect(() => {
    setCardType(getCardType(cardNumber));
  }, [cardNumber]);

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber((e.target as HTMLInputElement).value) as number;
    form.setValue('newCard.cardNumber', formatted.replace(/\s/g, ''));

    (e.target as HTMLInputElement).value = formatted;
  };

  const handleExpiryMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {

    const value = (e.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 2);
    form.setValue('newCard.expiryMonth', value);
  };

  const handleExpiryYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {

    const value = (e.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 2);
    form.setValue('newCard.expiryYear', value);
  };

  const handleCVVChange = (e: React.ChangeEvent<HTMLInputElement>) => {

    const value = (e.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, cardType === 'amex' ? 4 : 3);
    form.setValue('newCard.cvv', value);
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Card Preview */}
      <div className='relative h-48 w-full max-w-sm mx-auto perspective-1000'>
        <div
          className={cn(
            'absolute inset-0 w-full h-full transition-transform duration-700 transform-style-preserve-3d',
            isFlipped && 'rotate-y-180'
          )}
        >
          {/* Front of card */}
          <div className='absolute inset-0 w-full h-full backface-hidden'>
            <div className='h-full w-full rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 p-6 text-white shadow-xl'>
              <div className='flex justify-between items-start mb-8'>
                <div className='h-10 w-14 bg-yellow-400 rounded'></div>
                {cardIcons[cardType] || <CreditCard className='h-8 w-12 text-gray-400' />}
              </div>
              <div className='mb-4'>
                <div className='text-lg font-mono tracking-wider'>
                  {formatCardNumber(cardNumber) as number || '•••• •••• •••• ••••'}
                </div>
              </div>
              <div className='flex justify-between items-end'>
                <div>
                  <div className='text-xs uppercase opacity-70'>Card Holder</div>
                  <div className='text-sm'>
                    {form.watch('newCard.cardholderName') || 'YOUR NAME'}
                  </div>
                </div>
                <div>
                  <div className='text-xs uppercase opacity-70'>Expires</div>
                  <div className='text-sm'>
                    {expiryMonth || 'MM'}/{expiryYear || 'YY'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Back of card */}
          <div className='absolute inset-0 w-full h-full rotate-y-180 backface-hidden'>
            <div className='h-full w-full rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 shadow-xl'>
              <div className='h-12 bg-gray-700 mt-6'></div>
              <div className='p-6'>
                <div className='bg-white text-gray-900 rounded p-2 text-right font-mono mb-4'>
                  {cvv || '•••'}
                </div>
                <div className='text-xs text-gray-400'>
                  This card is protected by advanced security features.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Input Fields */}
      <div className='space-y-4'>
        <div className='space-y-2'>
          <Label htmlFor='cardNumber'>Card Number</Label>
          <div className='relative'>
            <CreditCard className='absolute left-3 top-2.5 h-4 w-4 text-muted-foreground' />
            <Input
              id='cardNumber'
              placeholder='1234 5678 9012 3456'
              className='pl-10'
              onChange={handleCardNumberChange}
              maxLength={19}
              disabled={disabled}
              defaultValue={formatCardNumber(cardNumber) as number}
            />
          </div>
          {form.formState.errors.newCard?.cardNumber && (
            <p className='text-xs text-destructive flex items-center gap-1'>
              <AlertCircle className='h-3 w-3' />
              {(form.formState.errors.newCard.cardNumber as any)?.message}
            </p>
          )}
        </div>

        <div className='space-y-2'>
          <Label htmlFor='cardholderName'>Cardholder Name</Label>
          <Input
            id='cardholderName'
            placeholder='John Doe'
            {...form.register('newCard.cardholderName')}
            disabled={disabled}
          />
          {form.formState.errors.newCard?.cardholderName && (
            <p className='text-xs text-destructive flex items-center gap-1'>
              <AlertCircle className='h-3 w-3' />
              {(form.formState.errors.newCard.cardholderName as any)?.message}
            </p>
          )}
        </div>

        <div className='grid grid-cols-2 gap-4'>
          <div className='space-y-2'>
            <Label htmlFor='expiry'>Expiry Date</Label>
            <div className='flex gap-2'>
              <div className='relative flex-1'>
                <Calendar className='absolute left-3 top-2.5 h-4 w-4 text-muted-foreground' />
                <Input
                  id='expiryMonth'
                  placeholder='MM'
                  className='pl-10'
                  onChange={handleExpiryMonthChange}
                  maxLength={2}
                  disabled={disabled}
                  value={expiryMonth}
                />
              </div>
              <Input
                id='expiryYear'
                placeholder='YY'
                onChange={handleExpiryYearChange}
                maxLength={2}
                disabled={disabled}
                value={expiryYear}
              />
            </div>
            {(form.formState.errors.newCard?.expiryMonth ||
              form.formState.errors.newCard?.expiryYear) && (
              <p className='text-xs text-destructive flex items-center gap-1'>
                <AlertCircle className='h-3 w-3' />
                Invalid expiry date
              </p>
            )}
          </div>

          <div className='space-y-2'>
            <Label htmlFor='cvv'>CVV</Label>
            <div className='relative'>
              <Lock className='absolute left-3 top-2.5 h-4 w-4 text-muted-foreground' />
              <Input
                id='cvv'
                placeholder={cardType === 'amex' ? '1234' : '123'}
                className='pl-10'
                onChange={handleCVVChange}
                onFocus={() => setIsFlipped(true)}
                onBlur={() => setIsFlipped(false)}
                maxLength={cardType === 'amex' ? 4 : 3}
                disabled={disabled}
                value={cvv}
              />
            </div>
            {form.formState.errors.newCard?.cvv && (
              <p className='text-xs text-destructive flex items-center gap-1'>
                <AlertCircle className='h-3 w-3' />
                {(form.formState.errors.newCard.cvv as any)?.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className='flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-3'>
        <Lock className='h-3 w-3' />
        <span>Your payment information is encrypted and secure</span>
      </div>
    </div>
  );
};
