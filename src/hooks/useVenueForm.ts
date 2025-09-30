import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useAuth } from '@/providers/AuthProvider';
import { venueSchema, VenueFormValues } from '@/lib/validations/venueValidation';

export { type VenueFormValues } from '@/lib/validations/venueValidation';

export const useVenueForm = (onSuccess: (venueId: string) => void) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const { user } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    getValues,
    reset,
  } = useForm<VenueFormValues>({
    resolver: zodResolver(venueSchema),
    defaultValues: {
      name: '',
      description: '',
      capacity: 0,
      price: 0,
      minHours: 1,
      type: '',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'United States',
      amenities: [],
      features: [],
      rules: [],
    },
  });

  const onSubmit = async (data: VenueFormValues) => {
    try {
      setIsSubmitting(true);

      if (!user) {
        toast.error('You must be logged in to list a venue');
        return;
      }

      // In a real application, this would upload images and create a venue in the database
      // For demonstration, we'll simulate an API call with a delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      const venueId = `v-${Date.now().toString().slice(-8)}`;

      // Show success message and navigate
      toast.success('Your venue listing has been submitted for review', {
        description: "We'll notify you once your listing is approved.",
      });

      reset();
      onSuccess(venueId);
    } catch (error) {
      toast.error('Failed to submit venue listing', {
        description: 'Please try again later.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = (files: FileList | null) => {
    if (!files) return;

    const newImages = Array.from(files);

    // Basic validation
    const invalidImages = newImages.filter(file => {
      const isValidType = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB
      return !isValidType || !isValidSize;
    });

    if (invalidImages.length > 0) {
      toast.error("Some images couldn't be uploaded", {
        description: 'Please ensure all files are JPG, PNG, or WebP and under 5MB.',
      });
    }

    const validImages = newImages.filter(file => {
      const isValidType = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB
      return isValidType && isValidSize;
    });

    setImages(prev => [...prev, ...validImages]);
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  return {
    register,
    handleSubmit,
    errors,
    isSubmitting,
    onSubmit,
    images,
    handleImageUpload,
    removeImage,
    setValue,
    getValues,
  };
};
