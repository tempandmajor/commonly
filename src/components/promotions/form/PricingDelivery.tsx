import { UseFormReturn } from 'react-hook-form';
import { PromotionFormValues } from './types';
import { FormFieldWrapper } from '@/components/shared/form-fields/FormFieldWrapper';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface PricingDeliveryProps {
  form: UseFormReturn<PromotionFormValues>;
  isLoading: boolean;
}

export const PricingDelivery = ({ form, isLoading }: PricingDeliveryProps) => {
  const deliveryMethod = form.watch('deliveryMethod');

  return (
    <div className='space-y-4'>
      <h3 className='text-lg font-medium'>Pricing & Delivery</h3>

      <FormFieldWrapper
        form={form}
        name='bidAmount'
        label='Bid Amount ($)'
        description="How much you're willing to pay per view"
      >
        <Input type='number' step='0.01' min='0.01' placeholder='0.05' disabled={isLoading} />
      </FormFieldWrapper>

      <FormFieldWrapper
        form={form}
        name='deliveryMethod'
        label='Delivery Method'
        description='How your promotion will be delivered to users'
      >
        <RadioGroup
          className='flex flex-col space-y-3'
          disabled={isLoading}
          defaultValue={form.getValues('deliveryMethod')}
          onValueChange={value =>
            form.setValue('deliveryMethod', value as 'feed' | 'ai-message' | 'combined')
          }
        >
          <div className='flex items-center space-x-2'>
            <RadioGroupItem value='feed' id='feed' />
            <Label htmlFor='feed'>Feed (Standard display in user feeds)</Label>
          </div>
          <div className='flex items-center space-x-2'>
            <RadioGroupItem value='ai-message' id='ai-message' />
            <Label htmlFor='ai-message'>AI Message (Delivered as a personalized message)</Label>
          </div>
          <div className='flex items-center space-x-2'>
            <RadioGroupItem value='combined' id='combined' />
            <Label htmlFor='combined'>Combined (Both feed and AI message)</Label>
          </div>
        </RadioGroup>
      </FormFieldWrapper>

      {((deliveryMethod === 'ai-message' || deliveryMethod === 'combined')) && (
        <FormFieldWrapper
          form={form}
          name='aiDeliveryTone'
          label='AI Message Tone'
          description='The tone for AI-delivered messages'
        >
          <Select disabled={isLoading}>
            <SelectTrigger>
              <SelectValue placeholder='Select tone' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='casual'>Casual & Friendly</SelectItem>
              <SelectItem value='professional'>Professional & Formal</SelectItem>
              <SelectItem value='friendly'>Enthusiastic & Engaging</SelectItem>
            </SelectContent>
          </Select>
        </FormFieldWrapper>
      )}
    </div>
  );
};
