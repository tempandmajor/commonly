import { UseFormReturn } from 'react-hook-form';
import { PromotionFormValues } from './types';
import { FormFieldWrapper } from '@/components/shared/form-fields/FormFieldWrapper';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useQuery } from '@tanstack/react-query';
import { getPromotableItems } from '@/services/promotionUtils';

interface BasicPromotionInfoProps {
  form: UseFormReturn<PromotionFormValues>;
  isLoading: boolean;
}

export const BasicPromotionInfo = ({ form, isLoading }: BasicPromotionInfoProps) => {
  const { data: promotableItems = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['promotableItems', form.watch('targetType')],
    queryFn: () => getPromotableItems(form.watch('targetType')),
    enabled: !!form.watch('targetType'),
  });

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
      <FormFieldWrapper form={form} name='targetType' label='What are you promoting?'>
        <Select disabled={isLoading}>
          <SelectTrigger>
            <SelectValue placeholder='Select what to promote' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='event'>Event</SelectItem>
            <SelectItem value='venue'>Venue</SelectItem>
            <SelectItem value='caterer'>Caterer</SelectItem>
            <SelectItem value='artist'>Artist</SelectItem>
            <SelectItem value='post'>Post</SelectItem>
          </SelectContent>
        </Select>
      </FormFieldWrapper>

      <FormFieldWrapper form={form} name='targetId' label='Select Item'>
        <Select disabled={isLoading || itemsLoading || !form.watch('targetType')}>
          <SelectTrigger>
            <SelectValue placeholder='Select the specific item' />
          </SelectTrigger>
          <SelectContent>
            {promotableItems.map(item => (
              <SelectItem key={item.id} value={item.id}>
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormFieldWrapper>

      <FormFieldWrapper form={form} name='title' label='Promotion Title'>
        <Input placeholder='Enter a catchy title' disabled={isLoading} />
      </FormFieldWrapper>

      <FormFieldWrapper
        form={form}
        name='description'
        label='Description'
        description='This will be shown with your promotion'
      >
        <Textarea
          placeholder="Describe what you're promoting"
          className='resize-none'
          disabled={isLoading}
        />
      </FormFieldWrapper>
    </div>
  );
};
