import React, { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, X, Loader2, Upload, Image as ImageIcon, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { z } from 'zod';

const communityFormSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(50, 'Name must be less than 50 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(500, 'Description must be less than 500 characters'),
  category: z.string().min(1, 'Please select a category'),
  tags: z.array(z.string()).optional(),
  isPrivate: z.boolean().default(false),
  rules: z.array(z.string()).optional(),
  enableSubscriptions: z.boolean().default(false),
  monthlyPrice: z.number().min(0).optional(),
  yearlyPrice: z.number().min(0).optional(),
});

type CommunityFormValues = z.infer<typeof communityFormSchema>;

export interface EnhancedCommunityFormProps {
  onSuccess?: () => void | undefined;
}

const EnhancedCommunityForm: React.FC<EnhancedCommunityFormProps> = ({ onSuccess }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [ruleInput, setRuleInput] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const form = useForm<CommunityFormValues>({
    resolver: zodResolver(communityFormSchema),
    defaultValues: {
      name: '',
      description: '',
      category: '',
      tags: [],
      isPrivate: false,
      rules: [],
      enableSubscriptions: false,
      monthlyPrice: 0,
      yearlyPrice: 0,
    },
  });

  const watchSubscriptions = form.watch('enableSubscriptions');

  const uploadImage = useCallback(async (file: File, type: 'image' | 'cover') => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `communities/${type}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('community-images')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('community-images')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
      return null;
    }
  }, []);

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'cover') => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    if (type === 'image') {
      setUploadingImage(true);
    } else {
      setUploadingCover(true);
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      if (type === 'image') {
        setImagePreview(e.target?.result as string);
      } else {
        setCoverPreview(e.target?.result as string);
      }
    };
    reader.readAsDataURL(file);

    if (type === 'image') {
      setUploadingImage(false);
    } else {
      setUploadingCover(false);
    }
  }, []);

  const handleSubmit = async (values: CommunityFormValues) => {
    try {
      setIsSubmitting(true);
      if (!user) {
        toast.error('You must be logged in to create a community');
        return;
      }

      // Prepare community data for database
      const communityData = {
        name: values.name,
        description: values.description,
        creator_id: user.id,
        category: values.category,
        tags: values.tags || [],
        is_private: values.isPrivate,
        rules: values.rules || [],
        subscription_enabled: values.enableSubscriptions,
        monthly_price_cents: values.enableSubscriptions && values.monthlyPrice ? Math.round(values.monthlyPrice * 100) : null,
        yearly_price_cents: values.enableSubscriptions && values.yearlyPrice ? Math.round(values.yearlyPrice * 100) : null,
        member_count: 1,
        image_url: imagePreview,
        cover_image_url: coverPreview,
      };

      // Insert community into database
      const { data, error } = await supabase
        .from('communities')
        .insert(communityData)
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        toast.error('Failed to create community. Please try again.');
        return;
      }

      toast.success('Community created successfully!');
      if (onSuccess) {
        onSuccess();
      } else {
        const typedData = data as any;
        navigate(`/community/${typedData.id}`);
      }
    } catch (error) {
      console.error('Error creating community:', error);
      toast.error('Failed to create community. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addTag = useCallback(() => {
    const currentTags = form.getValues('tags') || [];
    const trimmedTag = tagInput.trim().toLowerCase();

    if (trimmedTag && !currentTags.includes(trimmedTag) && currentTags.length < 10) {
      form.setValue('tags', [...currentTags, trimmedTag]);
      setTagInput('');
    }
  }, [tagInput, form]);

  const removeTag = useCallback((tagToRemove: string) => {
    const currentTags = form.getValues('tags') || [];
    form.setValue('tags', currentTags.filter(tag => tag !== tagToRemove));
  }, [form]);

  const addRule = useCallback(() => {
    const currentRules = form.getValues('rules') || [];
    const trimmedRule = ruleInput.trim();

    if (trimmedRule && currentRules.length < 10) {
      form.setValue('rules', [...currentRules, trimmedRule]);
      setRuleInput('');
    }
  }, [ruleInput, form]);

  const removeRule = useCallback((ruleToRemove: string) => {
    const currentRules = form.getValues('rules') || [];
    form.setValue('rules', currentRules.filter(rule => rule !== ruleToRemove));
  }, [form]);

  const categories = [
    'Technology',
    'Business',
    'Health & Fitness',
    'Arts & Culture',
    'Education',
    'Entertainment',
    'Sports',
    'Food & Drink',
    'Travel',
    'Gaming',
    'Music',
    'Photography',
    'Writing',
    'Science',
    'Other',
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-8'>
        {/* Basic Information */}
        <div className='space-y-6'>
          <h3 className='text-lg font-semibold text-[#2B2B2B]'>Basic Information</h3>

          <FormField
            control={form.control}
            name='name'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='text-[#2B2B2B]'>Community Name *</FormLabel>
                <FormControl>
                  <Input
                    placeholder='Enter community name'
                    className='border-gray-300'
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Choose a clear, memorable name for your community.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='description'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='text-[#2B2B2B]'>Description *</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder='Describe what your community is about...'
                    className='min-h-[120px] border-gray-300'
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Explain the purpose and goals of your community. Be specific about what members can expect.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='category'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='text-[#2B2B2B]'>Category *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className='border-gray-300'>
                      <SelectValue placeholder='Select a category' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Choose the category that best describes your community.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Images */}
        <div className='space-y-6'>
          <h3 className='text-lg font-semibold text-[#2B2B2B]'>Community Images</h3>

          <div className='grid md:grid-cols-2 gap-6'>
            <div>
              <label className='text-sm font-medium text-[#2B2B2B] mb-2 block'>
                Community Avatar
              </label>
              <div className='border-2 border-dashed border-gray-300 rounded-lg p-6 text-center'>
                {imagePreview ? (
                  <div className='space-y-3'>
                    <img
                      src={imagePreview}
                      alt='Community avatar preview'
                      className='w-24 h-24 rounded-full mx-auto object-cover'
                    />
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      onClick={() => setImagePreview(null)}
                      className='border-gray-300'
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className='space-y-3'>
                    <ImageIcon className='w-12 h-12 text-gray-400 mx-auto' />
                    <p className='text-sm text-gray-600'>Upload community avatar</p>
                    <input
                      type='file'
                      accept='image/*'
                      onChange={(e) => handleImageUpload(e, 'image')}
                      className='hidden'
                      id='avatar-upload'
                    />
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      onClick={() => (document.getElementById('avatar-upload') as HTMLInputElement | null)?.click()}
                      disabled={uploadingImage}
                      className='border-gray-300'

                    >
                      {uploadingImage ? (
                        <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                      ) : (
                        <Upload className='w-4 h-4 mr-2' />
                      )}
                      Upload Image

                    </Button>

                  </div>

                )}
              </div>
            </div>

            <div>
              <label className='text-sm font-medium text-[#2B2B2B] mb-2 block'>
                Cover Image
              </label>
              <div className='border-2 border-dashed border-gray-300 rounded-lg p-6 text-center'>
                {coverPreview ? (
                  <div className='space-y-3'>
                    <img
                      src={coverPreview}
                      alt='Cover preview'
                      className='w-full h-24 mx-auto object-cover rounded'
                    />
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      onClick={() => setCoverPreview(null)}
                      className='border-gray-300'
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className='space-y-3'>
                    <ImageIcon className='w-12 h-12 text-gray-400 mx-auto' />
                    <p className='text-sm text-gray-600'>Upload cover image</p>
                    <input
                      type='file'
                      accept='image/*'
                      onChange={(e) => handleImageUpload(e, 'cover')}
                      className='hidden'
                      id='cover-upload'
                    />
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      onClick={() => (document.getElementById('cover-upload') as HTMLInputElement | null)?.click()}
                      disabled={uploadingCover}
                      className='border-gray-300'

                    >
                      {uploadingCover ? (
                        <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                      ) : (
                        <Upload className='w-4 h-4 mr-2' />
                      )}
                      Upload Cover

                    </Button>

                  </div>

                )}
              </div>
            </div>

          </div>

        </div>

        {/* Tags */}
        <div className='space-y-4'>
          <label className='text-sm font-medium text-[#2B2B2B] block'>
            Tags (max 10)
          </label>
          <div className='flex gap-2 mb-2 flex-wrap'>
            {form.watch('tags')?.map(tag => (
              <Badge key={tag} variant='secondary' className='bg-gray-100 text-gray-800'>
                {tag}
                <Button
                  type='button'
                  variant='ghost'
                  size='icon'
                  className='h-4 w-4 ml-1 hover:bg-gray-200'
                  onClick={() => removeTag(tag)}
                >
                  <X className='h-3 w-3' />
                </Button>
              </Badge>
            ))}
          </div>
          <div className='flex gap-2'>
            <Input
              value={tagInput}
              onChange={(e) => setTagInput((e.target as HTMLInputElement).value)}
              placeholder='Add a tag'
              className='border-gray-300'
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
            />
            <Button
              type='button'
              variant='outline'
              onClick={addTag}
              disabled={!tagInput.trim() || (form.watch('tags')?.length || 0) >= 10}
              className='border-gray-300'
            >
              Add
            </Button>
          </div>
          <p className='text-xs text-gray-600'>
            Add tags to help people discover your community.
          </p>
        </div>

        {/* Community Rules */}
        <div className='space-y-4'>
          <label className='text-sm font-medium text-[#2B2B2B] block'>
            Community Rules (max 10)
          </label>
          <div className='space-y-2'>
            {form.watch('rules')?.map((rule, index) => (
              <div key={index} className='flex items-start gap-3 p-3 bg-gray-50 rounded-lg'>
                <span className='text-sm font-medium text-[#2B2B2B] mt-0.5'>
                  {index + 1}.
                </span>
                <p className='text-sm text-gray-700 flex-1'>{rule}</p>
                <Button
                  type='button'
                  variant='ghost'
                  size='icon'
                  className='h-6 w-6 hover:bg-gray-200'
                  onClick={() => removeRule(rule)}
                >
                  <X className='h-3 w-3' />
                </Button>
              </div>
            ))}
          </div>
          <div className='flex gap-2'>
            <Input
              value={ruleInput}
              onChange={(e) => setRuleInput((e.target as HTMLInputElement).value)}
              placeholder='Add a community rule'
              className='border-gray-300'
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRule())}
            />
            <Button
              type='button'
              variant='outline'
              onClick={addRule}
              disabled={!ruleInput.trim() || (form.watch('rules')?.length || 0) >= 10}
              className='border-gray-300'
            >
              Add Rule
            </Button>
          </div>
          <p className='text-xs text-gray-600'>
            Set clear guidelines for your community members.
          </p>
        </div>

        {/* Privacy Settings */}
        <div className='space-y-6'>
          <h3 className='text-lg font-semibold text-[#2B2B2B]'>Privacy & Access</h3>

          <FormField
            control={form.control}
            name='isPrivate'
            render={({ field }) => (
              <FormItem className='flex flex-row items-center justify-between rounded-lg border border-gray-300 p-4'>
                <div className='space-y-0.5'>
                  <FormLabel className='text-base text-[#2B2B2B]'>
                    Private Community
                  </FormLabel>
                  <FormDescription>
                    Only invited members can see and join this community.
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='enableSubscriptions'
            render={({ field }) => (
              <FormItem className='flex flex-row items-center justify-between rounded-lg border border-gray-300 p-4'>
                <div className='space-y-0.5'>
                  <FormLabel className='text-base text-[#2B2B2B]'>
                    Premium Community
                  </FormLabel>
                  <FormDescription>
                    Enable paid subscriptions for exclusive access and features.
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {watchSubscriptions && (
            <div className='space-y-4 pl-4 border-l-2 border-gray-200'>
              <FormField
                control={form.control}
                name='monthlyPrice'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-[#2B2B2B]'>Monthly Subscription Price</FormLabel>
                    <FormControl>
                      <div className='relative'>
                        <DollarSign className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
                        <Input
                          type='number'
                          placeholder='0.00'
                          className='pl-10 border-gray-300'
                          {...field}
                          onChange={(e) => field.onChange(parseFloat((e.target as HTMLInputElement).value) || 0)}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Monthly subscription price in USD. Leave as 0 to disable monthly subscriptions.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='yearlyPrice'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-[#2B2B2B]'>Yearly Subscription Price</FormLabel>
                    <FormControl>
                      <div className='relative'>
                        <DollarSign className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
                        <Input
                          type='number'
                          placeholder='0.00'
                          className='pl-10 border-gray-300'
                          {...field}
                          onChange={(e) => field.onChange(parseFloat((e.target as HTMLInputElement).value) || 0)}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Yearly subscription price in USD. Leave as 0 to disable yearly subscriptions.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className='flex justify-end gap-4 pt-6 border-t border-gray-200'>
          <Button
            type='button'
            variant='outline'
            onClick={() => navigate('/community')}
            disabled={isSubmitting}
            className='border-gray-300 text-[#2B2B2B] hover:bg-gray-50'
          >
            Cancel
          </Button>
          <Button
            type='submit'
            disabled={isSubmitting}
            className='bg-[#2B2B2B] hover:bg-gray-800 text-white'
          >
            {isSubmitting ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Creating...
              </>
            ) : (
              <>
                <Plus className='mr-2 h-4 w-4' />
                Create Community
              </>
            )}
          </Button>
        </div>

      </form>

    </Form>

  );

};

export default EnhancedCommunityForm;