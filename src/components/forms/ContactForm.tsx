'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  useKeyboardShortcuts,
  createSaveShortcut,
  createSubmitShortcut,
} from '@/hooks/useKeyboardShortcuts';
import {
  FormField,
  FormSection,
  FormActions,
  SearchSelect,
  SearchSelectOption,
} from '@/components/forms/shared';
import {
  contactFormSchema,
  contactFormDefaults,
  ContactFormValues,
} from '@/lib/validations/contactValidation';
import {
  Mail,
  Phone,
  Building2,
  MessageSquare,
  AlertTriangle,
  FileText,
  Upload,
  X,
  Send,
  CheckCircle,
  Zap,
  Info,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContactFormProps {
  onSubmit?: (data: ContactFormValues) => Promise<void> | undefined;
  defaultValues?: Partial<ContactFormValues> | undefined;
  showCompanyField?: boolean | undefined;
  showPhoneField?: boolean | undefined;
  showPriorityField?: boolean | undefined;
  showAttachments?: boolean | undefined;
  inquiryTypes?: string[] | undefined;
  className?: string | undefined;
}

interface FileAttachment {
  name: string;
  size: number;
  type: string;
  file: File;
  preview?: string | undefined;
}

export const ContactForm: React.FC<ContactFormProps> = ({
  onSubmit,
  defaultValues = {},
  showCompanyField = true,
  showPhoneField = true,
  showPriorityField = false,
  showAttachments = true,
  inquiryTypes,
  className,
}) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDraftSaved, setIsDraftSaved] = useState(false);
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [characterCount, setCharacterCount] = useState(0);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
          ...contactFormDefaults,
          ...defaultValues,
    },
  });

  const {
    setValue,
    watch,
    formState: { errors },
  } = form;
  const messageValue = watch('message');

  // Character count for message
  useEffect(() => {
    setCharacterCount(messageValue?.length || 0);
  }, [messageValue]);

  // Auto-save draft
  useEffect(() => {
    const timer = setTimeout(() => {
      if (messageValue && messageValue.length > 10) {
        localStorage.setItem('contact-form-draft', JSON.stringify(form.getValues()));
        setIsDraftSaved(true);
        setTimeout(() => setIsDraftSaved(false), 2000);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [messageValue, form]);

  // Load draft on mount
  useEffect(() => {
    const draft = localStorage.getItem('contact-form-draft');
    if (draft) {
      try {
        const draftData = JSON.parse(draft) as any;

        Object.keys(draftData).forEach(key => {
          if (draftData[key]) {
            setValue(key as keyof ContactFormValues, draftData[key]);
          }
        });
      } catch (_error) {
        // Error handling silently ignored
      }
    }
  }, [setValue]);

  // Keyboard shortcuts
  useKeyboardShortcuts([
    createSubmitShortcut(() => form.handleSubmit(handleSubmit)()),
    createSaveShortcut(() => {
      localStorage.setItem('contact-form-draft', JSON.stringify(form.getValues()));
      toast({ title: 'Draft saved', description: 'Your message has been saved locally' });
    }),
  ]);

  // Inquiry type options
  const inquiryTypeOptions: SearchSelectOption[] = (
    inquiryTypes || [
      'general',
      'support',
      'partnership',
      'media',
      'bug-report',
      'feature-request',
      'business',
      'other',
    ]
  ).map(type => ({
    value: type,
    label: type
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' '),
    icon: getInquiryIcon(type),
    description: getInquiryDescription(type),
  }));

  const priorityOptions: SearchSelectOption[] = [
    { value: 'low', label: 'Low', description: 'General inquiry, no rush' },
    { value: 'medium', label: 'Medium', description: 'Standard response time' },
    { value: 'high', label: 'High', description: 'Important matter, faster response needed' },
    {
      value: 'urgent',
      label: 'Urgent',
      description: 'Critical issue requiring immediate attention',
    },
  ];

  const followUpOptions: SearchSelectOption[] = [
    { value: 'email', label: 'Email', icon: <Mail className='w-4 h-4' /> },
    { value: 'phone', label: 'Phone', icon: <Phone className='w-4 h-4' /> },
    {
      value: 'either',
      label: 'Either Email or Phone',
      icon: <MessageSquare className='w-4 h-4' />,
    },
  ];

  function getInquiryIcon(type: string) {
    const icons: Record<string, React.ReactNode> = {
      general: <MessageSquare className='w-4 h-4' />,
      support: <Zap className='w-4 h-4' />,
      partnership: <Building2 className='w-4 h-4' />,
      media: <FileText className='w-4 h-4' />,
      'bug-report': <AlertTriangle className='w-4 h-4' />,
      'feature-request': <Info className='w-4 h-4' />,
      business: <Building2 className='w-4 h-4' />,
      other: <MessageSquare className='w-4 h-4' />,
    };
    return icons[type] || <MessageSquare className='w-4 h-4' />;
  }

  function getInquiryDescription(type: string) {
    const descriptions: Record<string, string> = {
      general: 'General questions or information requests',
      support: 'Technical support or help with using the platform',
      partnership: 'Business partnerships and collaboration opportunities',
      media: 'Press inquiries and media requests',
      'bug-report': 'Report bugs or technical issues',
      'feature-request': 'Suggest new features or improvements',
      business: 'Business inquiries and enterprise solutions',
      other: 'Other topics not covered above',
    };
    return descriptions[type] || '';
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target as HTMLElement.files || []);
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'image/',
      'application/pdf',
      'text/',
      'application/msword',
      'application/vnd.openxmlformats',
    ];

    files.forEach(file => {
      if (file.size > maxSize) {
        toast({
          title: 'File too large',
          description: `${file.name} is larger than 10MB`,
          variant: 'destructive',
        });
        return;
      }

      if (!allowedTypes.some(type => file.type.startsWith(type))) {
        toast({
          title: 'File type not supported',
          description: `${file.name} file type is not supported`,
          variant: 'destructive',
        });
        return;
      }

      if (attachments.length >= 5) {
        toast({
          title: 'Too many files',
          description: 'Maximum 5 attachments allowed',
          variant: 'destructive',
        });
        return;
      }

      const newAttachment: FileAttachment = {
        name: file.name,
        size: file.size,
        type: file.type,
        file,
      };

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = e => {
          newAttachment.preview = e.target?.result as string;
          setAttachments(prev => [...prev, newAttachment]);
        };
        reader.readAsDataURL(file);
      } else {
        setAttachments(prev => [...prev, newAttachment]);
      }
    });

    // Reset input
    (event.target as HTMLInputElement).value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (data: ContactFormValues) => {
    setIsSubmitting(true);

    try {
      // Add attachments to form data if any
      const formDataWithAttachments = {
          ...data,
        attachments: attachments.map(att => ({
          name: att.name,
          size: att.size,
          type: att.type,
          url: '', // Would be populated after upload
        })),
      };

      if (onSubmit) {
        await onSubmit(formDataWithAttachments);
      } else {
        // Default submission logic
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call

        toast({
          title: 'Message sent successfully!',
          description: "We'll get back to you as soon as possible.",
        });

        // Clear form and draft
        form.reset(contactFormDefaults);
        setAttachments([]);
        localStorage.removeItem('contact-form-draft');
      }
    } catch (error) {
      toast({
        title: 'Failed to send message',
        description: 'Please try again or contact us directly.',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearDraft = () => {
    localStorage.removeItem('contact-form-draft');
    form.reset(contactFormDefaults);
    setAttachments([]);
    toast({ title: 'Draft cleared', description: 'Form has been reset' });
  };

  return (
    <Card className={cn('w-full max-w-2xl mx-auto', className)}>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle className='flex items-center gap-2'>
              <Mail className='w-5 h-5' />
              Contact Us
            </CardTitle>
            <p className='text-sm text-muted-foreground mt-1'>
              Send us a message and we'll get back to you as soon as possible.
            </p>
          </div>

          {isDraftSaved && (
            <Badge variant='secondary' className='flex items-center gap-1'>
              <CheckCircle className='w-3 h-3' />
              Draft saved
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-6'>
          <FormSection title='Your Information'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <FormField
                form={form}
                name='name'
                label='Full Name'
                placeholder='Your full name'
                required
                icon={<User className='w-4 h-4' />}
              />

              <FormField
                form={form}
                name='email'
                label='Email Address'
                type='email'
                placeholder='your.email@example.com'
                required
                icon={<Mail className='w-4 h-4' />}
              />
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {showCompanyField && (
                <FormField
                  form={form}
                  name='company'
                  label='Company (Optional)'
                  placeholder='Your company name'
                  icon={<Building2 className='w-4 h-4' />}
                />
              )}

              {showPhoneField && (
                <FormField
                  form={form}
                  name='phone'
                  label='Phone Number (Optional)'
                  placeholder='+1 (555) 123-4567'
                  icon={<Phone className='w-4 h-4' />}
                />
              )}
            </div>
          </FormSection>

          <FormSection title='Message Details'>
            <div className='space-y-4'>
              <div>
                <label className='text-sm font-medium mb-2 block'>Inquiry Type (Optional)</label>
                <SearchSelect
                  options={inquiryTypeOptions}
                  value={watch('inquiryType') || ''}
                  onChange={value =>
                    setValue(
                      'inquiryType',
                      value as
                        | 'general'
                        | 'support'
                        | 'partnership'
                        | 'media'
                        | 'bug-report'
                        | 'feature-request'
                        | 'business'
                        | 'other'
                    )
                  }
                  placeholder='Select inquiry type'
                />
              </div>

              <FormField
                form={form}
                name='subject'
                label='Subject'
                placeholder='Brief description of your inquiry'
                required
                icon={<MessageSquare className='w-4 h-4' />}
              />

              <div className='space-y-2'>
                <label className='text-sm font-medium'>
                  Message <span className='text-destructive'>*</span>
                </label>
                <Textarea
          {...form.register('message')}
                  placeholder='Please provide details about your inquiry...'
                  rows={6}
                  className='resize-none'
                />
                <div className='flex justify-between items-center text-xs text-muted-foreground'>
                  <span>{characterCount}/2000 characters</span>
                  {errors.message && (
                    <span className='text-destructive'>{errors.message.message}</span>
                  )}
                </div>
              </div>

              {showPriorityField && (
                <div>
                  <label className='text-sm font-medium mb-2 block'>Priority Level</label>
                  <SearchSelect
                    options={priorityOptions}
                    value={watch('priority') || 'medium'}
                    onChange={value =>
                      setValue('priority', value as 'low' | 'medium' | 'high' | 'urgent')
                    }
                    placeholder='Select priority'
                  />
                </div>
              )}
            </div>
          </FormSection>

          {showAttachments && (
            <FormSection title='Attachments (Optional)'>
              <div className='space-y-4'>
                <Alert>
                  <Info className='w-4 h-4' />
                  <AlertDescription>
                    You can attach up to 5 files (max 10MB each). Supported formats: Images, PDFs,
                    documents.
                  </AlertDescription>
                </Alert>

                <div className='border-2 border-dashed rounded-lg p-6 text-center'>
                  <input
                    type='file'
                    id='file-upload'
                    multiple
                    accept='image/*,.pdf,.doc,.docx,.txt'
                    onChange={handleFileUpload}
                    className='hidden'
                  />
                  <label
                    htmlFor='file-upload'
                    className='cursor-pointer flex flex-col items-center gap-2'
                  >
                    <Upload className='w-8 h-8 text-muted-foreground' />
                    <span className='text-sm text-muted-foreground'>
                      Click to upload files or drag and drop
                    </span>
                  </label>
                </div>

                {attachments.length > 0 && (
                  <div className='space-y-2'>
                    {attachments.map((attachment, index) => (
                      <div
                        key={index}
                        className='flex items-center justify-between p-3 bg-muted rounded-lg'
                      >
                        <div className='flex items-center gap-3'>
                          {attachment.preview && (
                            <img
                              src={attachment.preview}
                              alt=''
                              className='w-10 h-10 object-cover rounded'
                            />
                          )}
                          <div>
                            <p className='text-sm font-medium'>{attachment.name}</p>
                            <p className='text-xs text-muted-foreground'>
                              {(attachment.size / 1024 / 1024).toFixed(1)} MB
                            </p>
                          </div>
                        </div>
                        <Button
                          type='button'
                          variant='ghost'
                          size='sm'
                          onClick={() => removeAttachment(index)}
                        >
                          <X className='w-4 h-4' />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </FormSection>
          )}

          <FormSection title='Contact Preferences'>
            <div className='space-y-4'>
              <div>
                <label className='text-sm font-medium mb-2 block'>Preferred Follow-up Method</label>
                <SearchSelect
                  options={followUpOptions}
                  value={watch('followUpMethod') || 'email'}
                  onChange={value =>
                    setValue('followUpMethod', value as 'email' | 'phone' | 'either')
                  }
                  placeholder='Select follow-up method'
                />
              </div>

              <div className='space-y-3'>
                <div className='flex items-start space-x-2'>
                  <input
                    type='checkbox'
                    id='consentToContact'
          {...form.register('consentToContact')}
                    className='mt-1'
                  />
                  <label htmlFor='consentToContact' className='text-sm'>
                    I consent to being contacted about my inquiry{' '}
                    <span className='text-destructive'>*</span>
                  </label>
                </div>
                {errors.consentToContact && (
                  <p className='text-sm text-destructive'>{errors.consentToContact.message}</p>
                )}

                <div className='flex items-start space-x-2'>
                  <input
                    type='checkbox'
                    id='marketingConsent'
          {...form.register('marketingConsent')}
                    className='mt-1'
                  />
                  <label htmlFor='marketingConsent' className='text-sm text-muted-foreground'>
                    I'd like to receive updates about new features and announcements (optional)
                  </label>
                </div>
              </div>
            </div>
          </FormSection>

          <Separator />

          <FormActions
            isSubmitting={isSubmitting}
            submitLabel='Send Message'
            submitIcon={<Send className='w-4 h-4' />}
            showCancel={false}
            showSaveDraft={true}
            onSaveDraft={clearDraft}
            align='between'
          />

          <div className='text-center'>
            <p className='text-xs text-muted-foreground'>
              Expected response time: 24-48 hours during business days
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ContactForm;
