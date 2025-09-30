'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { useKeyboardShortcuts, createSubmitShortcut } from '@/hooks/useKeyboardShortcuts';
import {
  FormField,
  FormSection,
  FormActions,
  SearchSelect,
  SearchSelectOption,
} from '@/components/forms/shared';
import {
  helpTicketSchema,
  helpTicketDefaults,
  HelpTicketFormValues,
  supportSearchSchema,
  supportSearchDefaults,
  SupportSearchFormValues,
  liveChatSchema,
  liveChatDefaults,
  LiveChatFormValues,
  getCategoryIcon,
  ticketCategory,
  ticketPriority,
} from '@/lib/validations/supportValidation';
import {
  HelpCircle,
  MessageSquare,
  Search,
  Upload,
  X,
  Send,
  Clock,
  ChevronRight,
  Book,
  MessageCircle,
  Phone,
  Mail,
  Paperclip,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SupportFormProps {
  defaultTab?: 'search' | undefined| 'ticket' | 'chat';
  onTicketSubmit?: (data: HelpTicketFormValues) => Promise<void> | undefined;
  onSearch?: (data: SupportSearchFormValues) => Promise<any[]> | undefined;
  onChatStart?: (data: LiveChatFormValues) => Promise<void> | undefined;
  currentUser?: {
    id: string | undefined;
    name: string;
    email: string;
    accountType?: string | undefined;
  };
  showLiveChat?: boolean;
  className?: string;
}

interface SearchResult {
  id: string;
  type: 'article' | 'faq' | 'ticket';
  title: string;
  excerpt?: string | undefined;
  category?: string | undefined;
  status?: string | undefined;
  helpful?: number | undefined;
  url?: string | undefined;
  updatedAt?: Date | undefined;
}

interface AttachmentFile {
  file: File;
  preview?: string | undefined;
}

const SupportForm: React.FC<SupportFormProps> = ({
  defaultTab = 'search',
  onTicketSubmit,
  onSearch,
  onChatStart,
  currentUser,
  showLiveChat = true,
  className,
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [systemInfo, setSystemInfo] = useState<Record<string, string>>({});

  // Gather system information
  useEffect(() => {
    const info = {
      browser: navigator.userAgent,
      os: navigator.platform,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      appVersion: navigator.appVersion,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
    };
    setSystemInfo(info);
  }, []);

  // Support ticket form
  const ticketForm = useForm<HelpTicketFormValues>({
    resolver: zodResolver(helpTicketSchema),
    defaultValues: {
          ...helpTicketDefaults,
      systemInfo,
    },
  });

  // Search form
  const searchForm = useForm<SupportSearchFormValues>({
    resolver: zodResolver(supportSearchSchema),
    defaultValues: supportSearchDefaults,
  });

  // Live chat form
  const chatForm = useForm<LiveChatFormValues>({
    resolver: zodResolver(liveChatSchema),
    defaultValues: {
          ...liveChatDefaults,
      ...(currentUser && {
        name: currentUser.name,
        email: currentUser.email,
      }),
    },
  });

  // Keyboard shortcuts
  useKeyboardShortcuts([
    createSubmitShortcut(() => {
      switch (activeTab) {
        case 'ticket':
          ticketForm.handleSubmit(handleTicketSubmit)();
          break;
        case 'search':
          searchForm.handleSubmit(handleSearch)();
          break;
        case 'chat':
          chatForm.handleSubmit(handleChatStart)();
          break;
      }
    }),
    {
      key: 'k',
      ctrl: true,
      callback: () => setActiveTab('search'),
      description: 'Focus search',
    },
  ]);

  // Category options
  const categoryOptions: SearchSelectOption[] = ticketCategory.map(cat => ({
    value: cat,
    label: cat
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' '),
    icon: <span>{getCategoryIcon(cat)}</span>,
  }));

  // Priority options
  const priorityOptions: SearchSelectOption[] = ticketPriority.map(priority => ({
    value: priority,
    label: priority.charAt(0).toUpperCase() + priority.slice(1),
  }));

  // Handle file attachments
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target as HTMLElement.files || []);
    const newAttachments: AttachmentFile[] = files.map(file => ({
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    }));
    setAttachments(prev => [...prev, ...newAttachments]);

  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => {
      const updated = [...prev];
      if (updated[index]?.preview) {
        URL.revokeObjectURL(updated[index].preview!);
      }
      updated.splice(index, 1);
      return updated;
    });
  };

  // Handle ticket submission
  const handleTicketSubmit = async (data: HelpTicketFormValues) => {
    if (!onTicketSubmit) return;

    try {
      setIsSubmitting(true);
      await onTicketSubmit({
          ...data,
        systemInfo,
        attachments: attachments.map(a => a.file),
      });
      toast.success('Support ticket submitted successfully!');
      ticketForm.reset();
      setAttachments([]);
    } catch (error) {
      toast.error('Failed to submit ticket. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle search
  const handleSearch = async (data: SupportSearchFormValues) => {
    if (!onSearch) return;

    try {
      setIsSearching(true);
      const results = await onSearch(data);
      setSearchResults(results);
    } catch (error) {
      toast.error('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  // Handle chat start
  const handleChatStart = async (data: LiveChatFormValues) => {
    if (!onChatStart) return;

    try {
      setIsSubmitting(true);
      await onChatStart(data);
      toast.success('Chat session started!');
    } catch (error) {
      toast.error('Failed to start chat. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={cn('max-w-4xl mx-auto space-y-6', className)}>
      {/* Header */}
      <div className='text-center space-y-2'>
        <h1 className='text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent'>
          How can we help you?
        </h1>
        <p className='text-muted-foreground'>
          Search our knowledge base, submit a ticket, or start a live chat
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
        <TabsList className='grid w-full grid-cols-3 bg-muted/50 backdrop-blur-sm'>
          <TabsTrigger value='search' className='flex items-center gap-2'>
            <Search className='h-4 w-4' />
            Search Help
          </TabsTrigger>
          <TabsTrigger value='ticket' className='flex items-center gap-2'>
            <HelpCircle className='h-4 w-4' />
            Submit Ticket
          </TabsTrigger>
          {showLiveChat && (
            <TabsTrigger value='chat' className='flex items-center gap-2'>
              <MessageSquare className='h-4 w-4' />
              Live Chat
            </TabsTrigger>
          )}
        </TabsList>

        {/* Search Tab */}
        <TabsContent value='search' className='space-y-6'>
          <Card className='border-0 shadow-lg bg-gradient-to-br from-card to-card/80'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Search className='h-5 w-5 text-primary' />
                Search Knowledge Base
              </CardTitle>
              <CardDescription>
                Find answers to common questions and troubleshooting guides
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={searchForm.handleSubmit(handleSearch)} className='space-y-4'>
                <FormField
                  form={searchForm}
                  name='query'
                  label='What can we help you with?'
                  placeholder='e.g., How to create an event, Payment issues, Account setup...'
                  autoFocus
                  disabled={isSearching}
                />

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <SearchSelect
                    form={searchForm}
                    name='category'
                    label='Category (Optional)'
                    placeholder='All categories'
                    options={categoryOptions}
                    disabled={isSearching}
                  />

                  <SearchSelect
                    form={searchForm}
                    name='type'
                    label='Content Type'
                    placeholder='All types'
                    options={[
                      { value: 'all', label: 'All Content' },
                      { value: 'article', label: 'Articles' },
                      { value: 'faq', label: 'FAQ' },
                      { value: 'tutorial', label: 'Tutorials' },
                    ]}
                    disabled={isSearching}
                  />
                </div>

                <FormActions
                  isSubmitting={isSearching}
                  submitLabel='Search'
                  submitIcon={<Search className='h-4 w-4' />}
                  className='w-full md:w-auto'
                />
              </form>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className='mt-6 space-y-3'>
                  <h3 className='font-semibold flex items-center gap-2'>
                    <FileText className='h-4 w-4' />
                    Search Results ({searchResults.length})
                  </h3>
                  <div className='space-y-2'>
                    {searchResults.map((result) => (
                      <Card key={result.id} className='p-4 hover:shadow-md transition-shadow cursor-pointer'>
                        <div className='flex items-start justify-between'>
                          <div className='flex-1'>
                            <div className='flex items-center gap-2 mb-1'>
                              <Badge variant='secondary'>{result.type}</Badge>
                              {result.category && (
                                <Badge variant='outline'>{result.category}</Badge>
                              )}
                            </div>
                            <h4 className='font-medium text-foreground hover:text-primary'>
                              {result.title}
                            </h4>
                            {result.excerpt && (
                              <p className='text-sm text-muted-foreground mt-1'>
                                {result.excerpt}
                              </p>
                            )}
                          </div>
                          <ChevronRight className='h-4 w-4 text-muted-foreground ml-2' />
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ticket Tab */}
        <TabsContent value='ticket' className='space-y-6'>
          <Card className='border-0 shadow-lg bg-gradient-to-br from-card to-card/80'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <HelpCircle className='h-5 w-5 text-primary' />
                Submit Support Ticket
              </CardTitle>
              <CardDescription>
                Can't find what you're looking for? Submit a detailed ticket and our team will help you
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={ticketForm.handleSubmit(handleTicketSubmit)} className='space-y-6'>
                <FormSection title='Contact Information'>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <FormField
                      form={ticketForm}
                      name='name'
                      label='Your Name'
                      placeholder='Enter your full name'
                      required
                      disabled={isSubmitting}
                    />
                    <FormField
                      form={ticketForm}
                      name='email'
                      label='Email Address'
                      type='email'
                      placeholder='Enter your email'
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </FormSection>

                <FormSection title='Issue Details'>
                  <div className='space-y-4'>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      <SearchSelect
                        form={ticketForm}
                        name='category'
                        label='Category'
                        placeholder='Select a category'
                        options={categoryOptions}
                        required
                        disabled={isSubmitting}
                      />
                      <SearchSelect
                        form={ticketForm}
                        name='priority'
                        label='Priority'
                        placeholder='Select priority level'
                        options={priorityOptions}
                        required
                        disabled={isSubmitting}
                      />
                    </div>

                    <FormField
                      form={ticketForm}
                      name='subject'
                      label='Subject'
                      placeholder='Brief description of your issue'
                      required
                      disabled={isSubmitting}
                    />

                    <div className='space-y-2'>
                      <label className='text-sm font-medium'>
                        Description <span className='text-destructive'>*</span>
                      </label>
                      <Textarea
                        placeholder='Please provide detailed information about your issue, including steps to reproduce if applicable...'
                        rows={6}
                        disabled={isSubmitting}
          {...ticketForm.register('description')}
                      />
                      {ticketForm.formState.errors.description && (
                        <p className='text-sm text-destructive'>
                          {ticketForm.formState.errors.description.message}
                        </p>
                      )}
                    </div>
                  </div>
                </FormSection>

                <FormSection title='Attachments (Optional)'>
                  <div className='space-y-4'>
                    <div className='flex items-center gap-4'>
                      <label className='flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors'>
                        <Upload className='h-4 w-4' />
                        <span className='text-sm'>Choose Files</span>
                        <input
                          type='file'
                          multiple
                          accept='image/*,.pdf,.doc,.docx,.txt'
                          onChange={handleFileUpload}
                          className='hidden'
                          disabled={isSubmitting}
                        />
                      </label>
                      <p className='text-xs text-muted-foreground'>
                        Max 10MB per file. Supported: Images, PDF, DOC, TXT
                      </p>
                    </div>

                    {attachments.length > 0 && (
                      <div className='space-y-2'>
                        <h4 className='text-sm font-medium'>Attached Files:</h4>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-2'>
                          {attachments.map((attachment, index) => (
                            <div
                              key={index}
                              className='flex items-center justify-between p-2 border rounded-lg'
                            >
                              <div className='flex items-center gap-2'>
                                <Paperclip className='h-4 w-4 text-muted-foreground' />
                                <span className='text-sm truncate'>{attachment.file.name}</span>
                              </div>
                              <Button
                                type='button'
                                variant='ghost'
                                size='sm'
                                onClick={() => removeAttachment(index)}
                                disabled={isSubmitting}
                              >
                                <X className='h-3 w-3' />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </FormSection>

                <FormActions
                  isSubmitting={isSubmitting}
                  submitLabel='Submit Ticket'
                  submitIcon={<Send className='h-4 w-4' />}
                  className='w-full'
                />
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Chat Tab */}
        {showLiveChat && (
          <TabsContent value='chat' className='space-y-6'>
            <Card className='border-0 shadow-lg bg-gradient-to-br from-card to-card/80'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <MessageSquare className='h-5 w-5 text-primary' />
                  Start Live Chat
                </CardTitle>
                <CardDescription>
                  Get instant help from our support team during business hours
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={chatForm.handleSubmit(handleChatStart)} className='space-y-6'>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <FormField
                      form={chatForm}
                      name='name'
                      label='Your Name'
                      placeholder='Enter your name'
                      required
                      disabled={isSubmitting}
                    />
                    <FormField
                      form={chatForm}
                      name='email'
                      label='Email Address'
                      type='email'
                      placeholder='Enter your email'
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className='space-y-2'>
                    <label className='text-sm font-medium'>
                      How can we help you today? <span className='text-destructive'>*</span>
                    </label>
                    <Textarea
                      placeholder='Please describe your question or issue briefly...'
                      rows={4}
                      disabled={isSubmitting}
          {...chatForm.register('initialMessage')}
                    />
                    {chatForm.formState.errors.initialMessage && (
                      <p className='text-sm text-destructive'>
                        {chatForm.formState.errors.initialMessage.message}
                      </p>
                    )}
                  </div>

                  <Alert>
                    <Clock className='h-4 w-4' />
                    <AlertDescription>
                      Live chat is available Monday - Friday, 9 AM - 6 PM EST. Outside these hours, please submit a support ticket.
                    </AlertDescription>
                  </Alert>

                  <FormActions
                    isSubmitting={isSubmitting}
                    submitLabel='Start Chat'
                    submitIcon={<MessageCircle className='h-4 w-4' />}
                    className='w-full'
                  />
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Contact Options */}
      <Card className='border-0 shadow-lg bg-gradient-to-br from-card to-card/80'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Phone className='h-5 w-5 text-primary' />
            Other Ways to Reach Us
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div className='flex items-center gap-3 p-4 border rounded-lg'>
              <Mail className='h-5 w-5 text-primary' />
              <div>
                <p className='font-medium'>Email Support</p>
                <p className='text-sm text-muted-foreground'>support@commonly.com</p>
              </div>
            </div>
            <div className='flex items-center gap-3 p-4 border rounded-lg'>
              <Phone className='h-5 w-5 text-primary' />
              <div>
                <p className='font-medium'>Phone Support</p>
                <p className='text-sm text-muted-foreground'>1-800-COMMONLY</p>
              </div>
            </div>
            <div className='flex items-center gap-3 p-4 border rounded-lg'>
              <Book className='h-5 w-5 text-primary' />
              <div>
                <p className='font-medium'>Help Center</p>
                <p className='text-sm text-muted-foreground'>help.commonly.com</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

};

export default SupportForm;