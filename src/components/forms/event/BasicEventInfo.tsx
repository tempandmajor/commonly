import React, { useContext } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { EventFormValues } from '@/lib/validations/eventValidation';
import { FileUpload } from '@/components/ui/file-upload';
import { FormFieldWrapper } from '@/components/shared/form-fields/FormFieldWrapper';
import { uploadMedia } from '@/services/media/uploader';
import { toast } from 'sonner';
import { useAuth } from '@/providers/AuthProvider';

interface BasicEventInfoProps {
  form: UseFormReturn<EventFormValues>;
  isLoading?: boolean | undefined;
  onUploadError?: (message: string) => void | undefined;
}

export const BasicEventInfo: React.FC<BasicEventInfoProps> = ({
  form,
  isLoading = false,
  onUploadError,
}) => {
  const { user } = useAuth();

  const handleBannerUpload = async (files: File[]) => {
    if (!files.length) return;

    try {
      toast.info('Uploading banner image...');

      const file = files[0];
      const userId = user?.id || 'anonymous';
      const eventId = new Date().getTime().toString();

      // Upload to events folder instead of using user ID
      const { url } = await uploadMedia(file, `events/${eventId}`, progress => {});

      form.setValue('bannerImage', url, { shouldValidate: true });
      form.clearErrors('bannerImage');
      toast.success('Banner image uploaded successfully');
    } catch (error) {
      const errorMessage = 'Failed to upload banner image. Please try again.';

      if (onUploadError) {
        onUploadError(errorMessage);
      } else {
        toast.error(errorMessage);
      }

      form.setError('bannerImage', {
        type: 'manual',
        message: errorMessage,
      });
    }
  };

  const handleImagesUpload = async (files: File[]) => {
    if (!files.length) return;

    try {
      toast.info(`Uploading ${files.length} additional images...`);

      const userId = user?.id || 'anonymous';
      const eventId = new Date().getTime().toString();
      const currentImages = form.getValues('images') || [];

      const uploadPromises = files.map(file =>
        uploadMedia(file, `events/${eventId}`, progress => {})
      );

      const results = await Promise.all(uploadPromises);
      const newImages = results.map(result => result.url);

      // Get existing images and add the new ones
      const existingImages: string[] = Array.isArray(currentImages) ? [...currentImages] : [];
      const allImages = [...existingImages, ...newImages];

      // Use form.setValue with proper type checking
      form.setValue('images', allImages as string[], { shouldValidate: true });
      toast.success(`${files.length} images uploaded successfully`);
    } catch (error) {
      toast.error('Failed to upload one or more images. Please try again.');
    }
  };

  const handleRemoveImage = (url: string, index: number) => {
    const currentImages = form.getValues('images') || [];
    // Ensure currentImages is an array
    const imagesArray = Array.isArray(currentImages) ? currentImages : [];
    const newImages = imagesArray.filter((_, i) => i !== index);
    form.setValue('images', newImages as unknown, { shouldValidate: true });
  };

  const handleRemoveBanner = () => {
    form.setValue('bannerImage', '', { shouldValidate: true });
  };

  return (
    <div className='space-y-4 border p-6 rounded-lg bg-card'>
      <h2 className='text-xl font-semibold'>Basic Information</h2>

      <FormFieldWrapper
        form={form}
        name='title'
        label='Event Title'
        description='Give your event a clear, descriptive title'
        required
      >
        <Input
          placeholder='e.g., Summer Music Festival 2025'
          disabled={isLoading}
          {...form.register('title')}
        />
      </FormFieldWrapper>

      <FormFieldWrapper
        form={form}
        name='shortDescription'
        label='Short Description'
        description='Write a brief summary of your event (max 160 characters)'
      >
        <Textarea
          placeholder='A brief description of your event'
          className='max-h-32'
          disabled={isLoading}
          {...form.register('shortDescription')}
        />
      </FormFieldWrapper>

      <FormFieldWrapper
        form={form}
        name='description'
        label='Full Description'
        description='Provide all the details about your event'
        required
      >
        <Textarea
          placeholder='Describe your event, including what attendees can expect'
          className='min-h-32'
          disabled={isLoading}
          {...form.register('description')}
        />
      </FormFieldWrapper>

      <FormFieldWrapper
        form={form}
        name='bannerImage'
        label='Banner Image'
        description='Upload a banner image for your event (required)'
        required
      >
        <FileUpload
          onFileSelect={handleBannerUpload}
          accept='image/*'
          maxFiles={1}
          maxSizeMB={5}
          existingUrls={form.watch('bannerImage') ? [form.watch('bannerImage')] : []}
          onRemoveExisting={handleRemoveBanner}
        />
      </FormFieldWrapper>

      <FormFieldWrapper
        form={form}
        name='images'
        label='Additional Images'
        description='Upload additional images for your event (optional)'
      >
        <FileUpload
          onFileSelect={handleImagesUpload}
          accept='image/*'
          multiple
          maxFiles={5}
          maxSizeMB={5}
          existingUrls={(form.watch('images') as string[]) || []}
          onRemoveExisting={handleRemoveImage}
        />
      </FormFieldWrapper>
    </div>
  );
};
