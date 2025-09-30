import React, { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { FileUpload } from '@/components/ui/file-upload';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { toast } from 'sonner';
import { z } from 'zod';
import CatererBasicInfoFields from './form/CatererBasicInfoFields';
import CatererPricingCapacityFields from './form/CatererPricingCapacityFields';
import CatererSpecialtiesFields from './form/CatererSpecialtiesFields';
import CatererContactFields from './form/CatererContactFields';

interface CatererFormData {
  name: string;
  description: string;
  cuisineType: string;
  location: string;
  pricePerPerson: string;
  minGuestCount: string;
  maxGuestCount: string;
  specialties: string;
  dietaryOptions: string;
  contactEmail: string;
  contactPhone: string;
}

interface CatererSubmissionData {
  name: string;
  description: string;
  cuisineType: string;
  location: string;
  pricePerPerson: number;
  minGuestCount?: number | undefined;
  maxGuestCount?: number | undefined;
  specialties: string[];
  dietaryOptions: string[];
  contactEmail?: string | undefined;
  contactPhone?: string | undefined;
  images: File[];
  status: 'pending';
}

interface CatererInitialData {
  name?: string | undefined;
  description?: string | undefined;
  cuisineType?: string | undefined;
  location?: string | undefined;
  pricePerPerson?: number | undefined;
  minGuestCount?: number | undefined;
  maxGuestCount?: number | undefined;
  specialties?: string[] | undefined;
  dietaryOptions?: string[] | undefined;
  contactEmail?: string | undefined;
  contactPhone?: string | undefined;
  images?: string[] | undefined;
}

interface CatererProfileFormProps {
  onSubmit?: (catererData: CatererSubmissionData) => Promise<void> | undefined;
  initialData?: CatererInitialData | undefined;
}

const catererFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  cuisineType: z.string().min(2, 'Cuisine type is required'),
  location: z.string().min(2, 'Location is required'),
  pricePerPerson: z
    .string()
    .refine(val => !isNaN(Number(val) as number) && Number(val) as number > 0, 'Price must be a positive number'),
  minGuestCount: z.string().optional(),
  maxGuestCount: z.string().optional(),
  specialties: z.string().optional(),
  dietaryOptions: z.string().optional(),
  contactEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
  contactPhone: z.string().optional(),
});

export const CatererProfileForm: React.FC<CatererProfileFormProps> = ({
  onSubmit,
  initialData,
}) => {
  const initialFormData: CatererFormData = useMemo(() => {
    return {
      name: initialData?.name ?? '',
      description: initialData?.description ?? '',
      cuisineType: initialData?.cuisineType ?? '',
      location: initialData?.location ?? '',
      pricePerPerson: initialData?.pricePerPerson != null ? String(initialData.pricePerPerson) : '',
      minGuestCount: initialData?.minGuestCount != null ? String(initialData.minGuestCount) : '',
      maxGuestCount: initialData?.maxGuestCount != null ? String(initialData.maxGuestCount) : '',
      specialties: initialData?.specialties?.join(', ') ?? '',
      dietaryOptions: initialData?.dietaryOptions?.join(', ') ?? '',
      contactEmail: initialData?.contactEmail ?? '',
      contactPhone: initialData?.contactPhone ?? '',
    };
  }, [initialData]);

  const [formData, setFormData] = useState<CatererFormData>(initialFormData);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

  }, [formErrors]);

  const handleFileSelect = useCallback((files: File[]) => {
    setSelectedFiles(files);

  }, []);

  const validateForm = useCallback((): boolean => {
    try {
      catererFormSchema.parse(formData);
      setFormErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path[0]) {
            newErrors[err.path[0].toString()] = err.message;
          }
        });
        setFormErrors(newErrors);
      }
      return false;
    }

  }, [formData]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix all form errors before submitting');
      return;
    }

    setIsSubmitting(true);

    try {
      const submitData: CatererSubmissionData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        cuisineType: formData.cuisineType.trim(),
        location: formData.location.trim(),
        pricePerPerson: Number(formData.pricePerPerson),
        specialties: formData.specialties
          ? formData.specialties.split(',').map(s => s.trim()).filter(Boolean)
          : [],
        dietaryOptions: formData.dietaryOptions
          ? formData.dietaryOptions.split(',').map(s => s.trim()).filter(Boolean)
          : [],
        images: selectedFiles,
        status: 'pending',
      };

      if (formData.minGuestCount) {
        submitData.minGuestCount = Number(formData.minGuestCount);
      }
      if (formData.maxGuestCount) {
        submitData.maxGuestCount = Number(formData.maxGuestCount);
      }
      if (formData.contactEmail) {
        submitData.contactEmail = formData.contactEmail.trim();
      }
      if (formData.contactPhone) {
        submitData.contactPhone = formData.contactPhone.trim();
      }

      if (onSubmit) {
        await onSubmit(submitData);

      } else {

        await new Promise<void>(resolve => {
          setTimeout(() => {
            toast.success('Caterer Profile Created', {
              description: 'Your profile is pending approval from our team.',
            });
            resolve();
          }, 1000);

        });
      }

    } catch (error) {
      toast.error('Failed to create caterer profile', {
        description: error instanceof Error ? error.message : 'Please try again later',
      });

    } finally {

      setIsSubmitting(false);
    }

  }, [formData, selectedFiles, onSubmit, validateForm]);

  return (

    <div className="w-full max-w-2xl mx-auto animate-fade-in">
      <Card className="card-hover">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-semibold tracking-tight">
            Create Your Caterer Profile
          </CardTitle>
          <CardDescription className="text-base">
            Showcase your culinary expertise and attract potential clients
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-6">
              <div className="animate-slide-in">
                <CatererBasicInfoFields
                  formData={formData}
                  handleInputChange={handleInputChange}
                />
                {formErrors.name && (
                  <p className="text-sm text-destructive mt-1">{formErrors.name}</p>
                )}
                {formErrors.description && (
                  <p className="text-sm text-destructive mt-1">{formErrors.description}</p>
                )}
                {formErrors.cuisineType && (
                  <p className="text-sm text-destructive mt-1">{formErrors.cuisineType}</p>
                )}
              </div>

              <div className="animate-slide-in-delay-1">
                <CatererPricingCapacityFields
                  formData={formData}
                  handleInputChange={handleInputChange}
                />
                {formErrors.location && (
                  <p className="text-sm text-destructive mt-1">{formErrors.location}</p>
                )}
                {formErrors.pricePerPerson && (
                  <p className="text-sm text-destructive mt-1">{formErrors.pricePerPerson}</p>
                )}
              </div>

              <div className="animate-slide-in-delay-2">
                <CatererSpecialtiesFields
                  formData={formData}
                  handleInputChange={handleInputChange}
                />
              </div>

              <div className="space-y-3 animate-slide-in-delay-3">
                <label className="text-sm font-medium text-foreground">
                  Caterer Photos
                </label>
                <p className="text-xs text-muted-foreground">
                  Upload up to 5 high-quality photos showcasing your food and setup
                </p>
                <FileUpload
                  onFileSelect={handleFileSelect}
                  maxFiles={5}
                />
              </div>

              <div className="animate-slide-in-delay-3">
                <CatererContactFields
                  formData={formData}
                  handleInputChange={handleInputChange}
                />
                {formErrors.contactEmail && (
                  <p className="text-sm text-destructive mt-1">{formErrors.contactEmail}</p>
                )}
              </div>
            </div>
          </form>
        </CardContent>

        <CardFooter className="pt-6">
          <Button
            type="submit"
            onClick={handleSubmit}
            className="w-full h-12 text-base font-medium transition-all duration-300 hover-scale"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                Submitting Profile...
              </div>
            ) : (
              'Submit Caterer Profile'
            )}
          </Button>
        </CardFooter>
      </Card>

    </div>

  );

};

export default CatererProfileForm;