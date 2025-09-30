import React, { useEffect, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { EventFormValues } from '@/lib/validations/eventValidation';
import { EventType } from '@/lib/types/event';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  ChevronRight,
  Clock,
  Target,
  FileText,
  Image as ImageIcon,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ValidationRule {
  id: string;
  label: string;
  description: string;
  required: boolean;
  validator: (values: EventFormValues) => boolean;
  step: number;
  category: 'basic' | 'details' | 'media' | 'settings';
}

interface FormValidationProps {
  form: UseFormReturn<EventFormValues>;
  currentStep: number;
  onStepChange: (step: number) => void;
}

const validationRules: ValidationRule[] = [
  // Basic Information (Step 0)
  {
    id: 'title',
    label: 'Event Title',
    description: 'A clear, descriptive title for your event',
    required: true,
    validator: values => !!values.title && values.title.length >= 3,
    step: 0,
    category: 'basic',
  },
  {
    id: 'description',
    label: 'Event Description',
    description: 'Detailed information about your event',
    required: true,
    validator: values => !!values.description && values.description.length >= 20,
    step: 0,
    category: 'basic',
  },
  {
    id: 'shortDescription',
    label: 'Short Description',
    description: 'Brief summary for event listings',
    required: true,
    validator: values => !!values.shortDescription && values.shortDescription.length >= 10,
    step: 0,
    category: 'basic',
  },
  {
    id: 'category',
    label: 'Event Category',
    description: 'Select the most appropriate category',
    required: true,
    validator: values => !!values.category,
    step: 0,
    category: 'basic',
  },
  {
    id: 'type',
    label: 'Event Type',
    description: 'Choose the format of your event',
    required: true,
    validator: values => !!values.type,
    step: 0,
    category: 'basic',
  },
  {
    id: 'virtualDetails',
    label: 'Virtual Event Details',
    description: 'Platform and streaming configuration',
    required: false,
    validator: values => {
      if (values.type === EventType.VirtualEvent || values.type === EventType.Hybrid) {
        return !!values.virtualEventDetails?.platform;
      }
      return true;
    },
    step: 0,
    category: 'basic',
  },
  {
    id: 'tourDetails',
    label: 'Tour Information',
    description: 'Tour dates and venue details',
    required: false,
    validator: values => {
      if (values.type === EventType.Tour) {
        return !!(values.tourDetails?.tourName && values.tourDetails?.tourDates?.length >= 2);
      }
      return true;
    },
    step: 0,
    category: 'basic',
  },

  // Date & Location (Step 1)
  {
    id: 'startDate',
    label: 'Start Date',
    description: 'When your event begins',
    required: true,
    validator: values => !!values.startDate && new Date(values.startDate) > new Date(),
    step: 1,
    category: 'details',
  },
  {
    id: 'location',
    label: 'Event Location',
    description: 'Where your event takes place',
    required: true,
    validator: values => {
      if (values.type === EventType.VirtualEvent) return true;
      return !!values.location && values.location.length >= 3;
    },
    step: 1,
    category: 'details',
  },

  // Pricing & Tickets (Step 2)
  {
    id: 'pricing',
    label: 'Event Pricing',
    description: 'Ticket price or free event',
    required: true,
    validator: values => {
      if (values.isFree) return true;
      return typeof values.price === 'number' && values.price > 0;
    },
    step: 2,
    category: 'details',
  },
  {
    id: 'targetAmount',
    label: 'Funding Goal',
    description: 'Total amount you aim to raise',
    required: true,
    validator: values => typeof values.targetAmount === 'number' && values.targetAmount > 0,
    step: 2,
    category: 'details',
  },

  // Media (Step 3)
  {
    id: 'bannerImage',
    label: 'Banner Image',
    description: 'Main image for your event',
    required: true,
    validator: values => !!values.bannerImage && values.bannerImage.length > 0,
    step: 3,
    category: 'media',
  },

  // Settings (Step 4)
  {
    id: 'seoOptimization',
    label: 'SEO Optimization',
    description: 'SEO title and description',
    required: false,
    validator: values => {
      if (values.seoTitle || values.seoDescription) {
        return !!values.seoTitle && !!values.seoDescription;
      }
      return true;
    },
    step: 4,
    category: 'settings',
  },
];

export const EnhancedFormValidation: React.FC<FormValidationProps> = ({
  form,
  currentStep,
  onStepChange,
}) => {
  const [validationResults, setValidationResults] = useState<Record<string, boolean>>({});
  const values = form.watch();

  useEffect(() => {
    const results: Record<string, boolean> = {};
    validationRules.forEach(rule => {
      results[rule.id] = rule.validator(values);
    });
    setValidationResults(results);
  }, [values]);

  const getStepValidation = (step: number) => {
    const stepRules = validationRules.filter(rule => rule.step === step);
    const passed = stepRules.filter(rule => validationResults[rule.id]).length;
    const required = stepRules.filter(rule => rule.required).length;
    const total = stepRules.length;

    return {
      passed,
      total,
      required,
      isValid: stepRules.filter(rule => rule.required).every(rule => validationResults[rule.id]),
      percentage: total > 0 ? Math.round((passed / total) * 100) : 0,
    };
  };

  const getCurrentStepRules = () => {
    return validationRules.filter(rule => rule.step === currentStep);
  };

  const getOverallProgress = () => {
    const totalRules = validationRules.length;
    const passedRules = Object.values(validationResults).filter(Boolean).length;
    return Math.round((passedRules / totalRules) * 100);
  };

  const getRequiredFieldsStatus = () => {
    const requiredRules = validationRules.filter(rule => rule.required);
    const passedRequired = requiredRules.filter(rule => validationResults[rule.id]).length;
    return {
      passed: passedRequired,
      total: requiredRules.length,
      percentage: Math.round((passedRequired / requiredRules.length) * 100),
    };
  };

  const canProceedToStep = (step: number) => {
    if (step <= currentStep) return true;

    // Check if all previous steps have required fields completed
    for (let i = 0; i < step; i++) {
      const stepValidation = getStepValidation(i);
      if (!stepValidation.isValid) return false;
    }
    return true;
  };

  const currentStepValidation = getStepValidation(currentStep);
  const overallProgress = getOverallProgress();
  const requiredStatus = getRequiredFieldsStatus();

  const stepIcons = {
    0: FileText,
    1: Clock,
    2: Target,
    3: ImageIcon,
    4: Settings,
  };

  return (
    <div className='space-y-6'>
      {/* Overall Progress */}
      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='text-lg'>Form Completion</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='space-y-2'>
            <div className='flex justify-between text-sm'>
              <span>Overall Progress</span>
              <span className='font-medium'>{overallProgress}%</span>
            </div>
            <Progress value={overallProgress} className='h-2' />
          </div>

          <div className='grid grid-cols-2 gap-4 text-sm'>
            <div className='space-y-1'>
              <div className='flex justify-between'>
                <span className='text-muted-foreground'>Required Fields</span>
                <span className='font-medium'>
                  {requiredStatus.passed}/{requiredStatus.total}
                </span>
              </div>
              <Progress value={requiredStatus.percentage} className='h-1' />
            </div>
            <div className='space-y-1'>
              <div className='flex justify-between'>
                <span className='text-muted-foreground'>Current Step</span>
                <span className='font-medium'>
                  {currentStepValidation.passed}/{currentStepValidation.total}
                </span>
              </div>
              <Progress value={currentStepValidation.percentage} className='h-1' />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step Navigation */}
      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='text-lg'>Step Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-5 gap-2'>
            {[0, 1, 2, 3, 4].map(step => {
              const stepValidation = getStepValidation(step);
              const canProceed = canProceedToStep(step);
              const StepIcon = stepIcons[step as keyof typeof stepIcons];

              return (
                <Button
                  key={step}
                  variant={
                    step === currentStep
                      ? 'default'
                      : stepValidation.isValid
                        ? 'secondary'
                        : 'outline'
                  }
                  size='sm'
                  onClick={() => canProceed && onStepChange(step)}
                  disabled={!canProceed}
                  className={cn(
                    'flex flex-col gap-1 h-auto py-2',
                    step === currentStep && 'ring-2 ring-primary ring-offset-2'
                  )}
                >
                  <StepIcon className='h-4 w-4' />
                  <span className='text-xs'>
                    {stepValidation.passed}/{stepValidation.total}
                  </span>
                  {stepValidation.isValid && <CheckCircle className='h-3 w-3 text-green-500' />}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Current Step Validation */}
      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='text-lg'>Current Step Requirements</CardTitle>
        </CardHeader>
        <CardContent className='space-y-3'>
          {getCurrentStepRules().map(rule => {
            const isValid = validationResults[rule.id];
            const Icon = isValid ? CheckCircle : rule.required ? XCircle : AlertCircle;
            const iconColor = isValid
              ? 'text-green-500'
              : rule.required
                ? 'text-red-500'
                : 'text-yellow-500';

            return (
              <div key={rule.id} className='flex items-start gap-3 p-3 rounded-lg border'>
                <Icon className={cn('h-5 w-5 mt-0.5', iconColor)} />
                <div className='flex-1 space-y-1'>
                  <div className='flex items-center gap-2'>
                    <span className='font-medium'>{rule.label}</span>
                    {rule.required && (
                      <Badge variant='destructive' className='text-xs'>
                        Required
                      </Badge>
                    )}
                    {isValid && (
                      <Badge variant='secondary' className='text-xs'>
                        Complete
                      </Badge>
                    )}
                  </div>
                  <p className='text-sm text-muted-foreground'>{rule.description}</p>
                </div>
              </div>
            );
          })}

          {currentStepValidation.isValid && (
            <Alert className='border-green-200 bg-green-50'>
              <CheckCircle className='h-4 w-4 text-green-600' />
              <AlertDescription className='text-green-800'>
                All required fields for this step are complete! You can proceed to the next step.
              </AlertDescription>
            </Alert>
          )}

          {!currentStepValidation.isValid && (
            <Alert className='border-amber-200 bg-amber-50'>
              <AlertCircle className='h-4 w-4 text-amber-600' />
              <AlertDescription className='text-amber-800'>
                Please complete the required fields above to proceed to the next step.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='text-lg'>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className='space-y-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => {
              const invalidRules = validationRules
                .filter(rule => rule.required && !validationResults[rule.id])
                .sort((a, b) => a.step - b.step);

              if (invalidRules.length > 0) {
                onStepChange(invalidRules[0].step);
              }
            }}
            className='w-full justify-start'
          >
            <ChevronRight className='h-4 w-4 mr-2' />
            Go to Next Required Field
          </Button>

          <Button
            variant='outline'
            size='sm'
            onClick={() => {
              // Auto-fill some basic fields for testing
              if (!values.title) form.setValue('title', 'Sample Event Title');
              if (!values.shortDescription)
                form.setValue('shortDescription', 'A brief description of the event');
              if (!values.description)
                form.setValue(
                  'description',
                  'This is a detailed description of the event with all the necessary information attendees need to know.'
                );
            }}
            className='w-full justify-start'
          >
            <Info className='h-4 w-4 mr-2' />
            Fill Sample Data (For Testing)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
