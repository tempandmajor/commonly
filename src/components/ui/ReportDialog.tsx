import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Flag, ShieldAlert, AlertTriangle, Info, Upload, X, Camera } from 'lucide-react';
import {
  FormField,
  FormSection,
  FormActions,
  SearchSelect,
  ImageUpload,
} from '@/components/forms/shared';
import {
  eventReportSchema,
  userReportSchema,
  contentReportSchema,
  productReportSchema,
  getReportReasonLabel,
  eventReportReasons,
  userReportReasons,
  contentReportReasons,
  productReportReasons,
  EventReportFormValues,
  UserReportFormValues,
  ContentReportFormValues,
  ProductReportFormValues,
  eventReportDefaults,
  userReportDefaults,
  contentReportDefaults,
  productReportDefaults,
} from '@/lib/validations/reportValidation';
import { useKeyboardShortcuts, createCancelShortcut } from '@/hooks/useKeyboardShortcuts';

type ReportType = 'event' | 'user' | 'content' | 'product';

interface BaseReportDialogProps {
  triggerButton?: React.ReactNode | undefined;
  onReportSubmit?: (data: unknown) => Promise<void> | undefined;
}

interface EventReportDialogProps extends BaseReportDialogProps {
  type: 'event';
  eventId: string;
  eventTitle: string;
}

interface UserReportDialogProps extends BaseReportDialogProps {
  type: 'user';
  userId: string;
  username: string;
}

interface ContentReportDialogProps extends BaseReportDialogProps {
  type: 'content';
  contentId: string;
  contentType: 'post' | 'comment' | 'message' | 'review';
  contentPreview?: string;
}

interface ProductReportDialogProps extends BaseReportDialogProps {
  type: 'product';
  productId: string;
  productName: string;
  sellerId?: string;
}

type ReportDialogProps =
  | EventReportDialogProps
  | UserReportDialogProps
  | ContentReportDialogProps
  | ProductReportDialogProps;

const ReportDialog: React.FC<ReportDialogProps> = props => {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  // Keyboard shortcuts
  useKeyboardShortcuts([createCancelShortcut(() => setOpen(false))]);

  // Get the appropriate schema and defaults based on report type
  const getFormConfig = () => {
    switch (props.type) {
      case 'event':
        return {
          schema: eventReportSchema,
          defaults: {
          ...eventReportDefaults,
            eventId: props.eventId,
            eventTitle: props.eventTitle,
          },
          reasons: eventReportReasons,
        };
      case 'user':
        return {
          schema: userReportSchema,
          defaults: {
          ...userReportDefaults,
            reportedUserId: props.userId,
            reportedUsername: props.username,
          },
          reasons: userReportReasons,
        };
      case 'content':
        return {
          schema: contentReportSchema,
          defaults: {
          ...contentReportDefaults,
            contentId: props.contentId,
            contentType: props.contentType,
            contentText: props.contentPreview,
          },
          reasons: contentReportReasons,
        };
      case 'product':
        return {
          schema: productReportSchema,
          defaults: {
          ...productReportDefaults,
            productId: props.productId,
            productName: props.productName,
            sellerId: props.sellerId,
          },
          reasons: productReportReasons,
        };
    }
  };

  const { schema, defaults, reasons } = getFormConfig();

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: defaults,
  });

  const handleSubmit = async (values: unknown) => {
    try {
      setIsSubmitting(true);

      // Add uploaded files to the submission
      const submissionData = {
          ...values,
        attachments: uploadedFiles,
        reportedAt: new Date().toISOString(),
        status: 'pending',
      };

      if (props.onReportSubmit) {
        await props.onReportSubmit(submissionData);
      } else {
        // Default behavior: store in localStorage for demo
        const storageKey = `${props.type}Reports`;
        const reports = JSON.parse(localStorage.getItem(storageKey) as any || '[]');
        reports.push(submissionData);
        localStorage.setItem(storageKey, JSON.stringify(reports));
      }

      toast.success('Report submitted successfully', {
        description: 'Our team will review your report within 24-48 hours.',
      });

      setOpen(false);
      form.reset();
      setUploadedFiles([]);
    } catch (error) {
      toast.error('Failed to submit report', {
        description: 'Please try again or contact support if the issue persists.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDialogTitle = () => {
    switch (props.type) {
      case 'event':
        return `Report Event: ${props.eventTitle}`;
      case 'user':
        return `Report User: @${props.username}`;
      case 'content':
        return `Report ${props.contentType}`;
      case 'product':
        return `Report Product: ${props.productName}`;
    }
  };

  const getDialogDescription = () => {
    switch (props.type) {
      case 'event':
        return 'Help us maintain a safe community by reporting events that violate our guidelines.';
      case 'user':
        return 'Report users who engage in harmful behavior or violate community standards.';
      case 'content':
        return 'Flag content that is inappropriate, harmful, or violates our policies.';
      case 'product':
        return 'Report products that are counterfeit, misleading, or prohibited.';
    }
  };

  const reasonOptions = reasons.map(reason => ({
    value: reason,
    label: getReportReasonLabel(reason),
  }));

  const priorityOptions = [
    { value: 'low', label: 'Low - Minor issue' },
    { value: 'medium', label: 'Medium - Moderate concern' },
    { value: 'high', label: 'High - Serious violation' },
    { value: 'urgent', label: 'Urgent - Immediate action needed' },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {props.triggerButton || (
          <Button variant='outline' size='sm'>
            <Flag className='mr-2 h-4 w-4' />
            Report
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className='sm:max-w-[600px] max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <ShieldAlert className='h-5 w-5 text-destructive' />
            {getDialogTitle()}
          </DialogTitle>
          <DialogDescription>{getDialogDescription()}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-6'>
            {/* Warning Alert */}
            <Alert>
              <AlertTriangle className='h-4 w-4' />
              <AlertDescription>
                False reports or abuse of the reporting system may result in action against your
                account. Please ensure your report is accurate and made in good faith.
              </AlertDescription>
            </Alert>

            {/* Reason Selection */}
            <FormSection
              title='Report Details'
              description='Select the reason that best describes the issue'
            >
              <div className='space-y-4'>
                <SearchSelect
                  form={form}
                  name='reason'
                  label='Reason for Report'
                  placeholder='Select a reason...'
                  options={reasonOptions}
                  required
                />

                <FormField
                  form={form}
                  name='details'
                  label='Additional Details'
                  type='textarea'
                  placeholder='Please provide specific details about the issue. Include any relevant context, dates, or other information that will help us investigate...'
                  description='Be as specific as possible. This helps our team take appropriate action.'
                  required
                  rows={4}
                />

                {/* Priority Selection */}
                <SearchSelect
                  form={form}
                  name='priority'
                  label='Priority Level'
                  placeholder='Select priority...'
                  options={priorityOptions}
                  description='Help us prioritize by indicating the severity of the issue'
                />
              </div>
            </FormSection>

            {/* Additional Fields Based on Report Type */}
            {props.type === 'event' && (
              <FormSection
                title='Event Information'
                description='Additional details about the event'
              >
                <div className='space-y-4'>
                  <FormField
                    form={form}
                    name='affectedUsers'
                    label='Estimated Affected Users'
                    type='number'
                    placeholder='0'
                    description='How many people might be affected by this issue?'
                  />

                  <FormField
                    form={form}
                    name='evidenceUrls'
                    label='Evidence URLs'
                    type='textarea'
                    placeholder='https://example.com/evidence (one per line)'
                    description='Links to any evidence supporting your report'
                  />
                </div>
              </FormSection>
            )}

            {props.type === 'user' && (
              <FormSection title='Incident Details' description='Information about the incident'>
                <div className='space-y-4'>
                  <FormField
                    form={form}
                    name='incidentDate'
                    label='When did this occur?'
                    type='date'
                    description='Approximate date of the incident'
                  />

                  <FormField
                    form={form}
                    name='previousReports'
                    label='Have you reported this user before?'
                    type='switch'
                  />
                </div>
              </FormSection>
            )}

            {props.type === 'product' && (
              <FormSection
                title='Purchase Information'
                description='Details about your purchase (if applicable)'
              >
                <div className='space-y-4'>
                  <FormField
                    form={form}
                    name='orderNumber'
                    label='Order Number'
                    placeholder='ORD-123456'
                    description='If you purchased this product'
                  />

                  <FormField form={form} name='purchaseDate' label='Purchase Date' type='date' />
                </div>
              </FormSection>
            )}

            {/* Evidence Upload */}
            <FormSection
              title='Supporting Evidence'
              description='Upload screenshots or other evidence (optional)'
            >
              <div className='space-y-4'>
                <div className='grid grid-cols-2 gap-4'>
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className='relative group'>
                      <img
                        src={file}
                        alt={`Evidence ${index + 1}`}
                        className='w-full h-32 object-cover rounded-lg'
                      />
                      <Button
                        type='button'
                        variant='destructive'
                        size='icon'
                        className='absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity'
                        onClick={() => {
                          setUploadedFiles(files => files.filter((_, i) => i !== index));
                        }}
                      >
                        <X className='h-3 w-3' />
                      </Button>
                    </div>
                  ))}

                  {uploadedFiles.length < 5 && (
                    <ImageUpload
                      value=''
                      onChange={url => {
                        if (url) setUploadedFiles([...uploadedFiles, url]);
                      }}
                      className='h-32'
                    >
                      <div className='flex flex-col items-center justify-center h-full border-2 border-dashed rounded-lg hover:border-primary transition-colors cursor-pointer'>
                        <Camera className='h-8 w-8 text-muted-foreground mb-2' />
                        <span className='text-sm text-muted-foreground'>Add Evidence</span>
                        <span className='text-xs text-muted-foreground mt-1'>
                          {5 - uploadedFiles.length} remaining
                        </span>
                      </div>
                    </ImageUpload>
                  )}
                </div>

                <p className='text-xs text-muted-foreground'>
                  You can upload up to 5 images. Supported formats: JPG, PNG, GIF (max 5MB each)
                </p>
              </div>
            </FormSection>

            {/* Contact Information */}
            <FormSection
              title='Contact Information'
              description="Optional - if you'd like us to follow up"
            >
              <FormField
                form={form}
                name='reporterEmail'
                label='Your Email'
                type='email'
                placeholder='your@email.com'
                description="We'll only use this to update you on your report"
              />
            </FormSection>

            <Separator />

            {/* Guidelines Info */}
            <div className='bg-muted/50 rounded-lg p-4'>
              <h4 className='text-sm font-medium flex items-center gap-2 mb-2'>
                <Info className='h-4 w-4' />
                What happens next?
              </h4>
              <ul className='text-xs text-muted-foreground space-y-1'>
                <li>• Our team will review your report within 24-48 hours</li>
                <li>• We may take action including warnings, suspensions, or content removal</li>
                <li>• You'll receive an update if you provided your email</li>
                <li>• All reports are kept confidential</li>
              </ul>
            </div>

            <DialogFooter>
              <FormActions
                isSubmitting={isSubmitting}
                submitLabel='Submit Report'
                onCancel={() => setOpen(false)}
                cancelLabel='Cancel'
              />
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ReportDialog;
