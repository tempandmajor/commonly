import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import SimpleHeader from '@/components/layout/SimpleHeader';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { realHelpService } from '@/services/realHelpService';
import { Mail, Phone } from 'lucide-react';

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const Contact = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>();

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    try {
      const submission = await realHelpService.createContactSubmission(
        data.name,
        data.email,
        data.subject,
        data.message,
        'general_inquiry',
        'medium'
      );

      if (!submission) {
        throw new Error('Failed to create contact submission');
      }

      toast({
        title: 'Message sent!',
        description: "We'll get back to you within 24-48 hours.",
      });
      reset();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again or email us directly.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='flex min-h-screen flex-col'>
      <SimpleHeader />

      <main className='flex-1 py-12'>
        <div className='container mx-auto px-4'>
          <div className='mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center'>
            <div>
              <h1 className='text-4xl font-bold'>Contact Us</h1>
              <p className='mt-2 text-muted-foreground'>
                Get in touch with the Commonly Studios team for collaborations, projects, or
                inquiries.
              </p>
            </div>
            <Link to='/studios'>
              <Button variant='outline'>Back to Studios</Button>
            </Link>
          </div>

          <Separator className='mb-8' />

          <div className='grid grid-cols-1 gap-8 md:grid-cols-2'>
            <div>
              <h2 className='mb-6 text-2xl font-semibold'>Send Us a Message</h2>

              <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
                <div className='space-y-2'>
                  <label htmlFor='name' className='text-sm font-medium'>
                    Name
                  </label>
                  <Input
                    id='name'
                    {...register('name', { required: 'Name is required' })}
                    placeholder='Your name'
                  />
                  {errors.name && <p className='text-sm text-gray-600'>{errors.name.message}</p>}
                </div>

                <div className='space-y-2'>
                  <label htmlFor='email' className='text-sm font-medium'>
                    Email
                  </label>
                  <Input
                    id='email'
                    type='email'
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: 'Invalid email address',
                      },
                    })}
                    placeholder='Your email address'
                  />
                  {errors.email && <p className='text-sm text-gray-600'>{errors.email.message}</p>}
                </div>

                <div className='space-y-2'>
                  <label htmlFor='subject' className='text-sm font-medium'>
                    Subject
                  </label>
                  <Input
                    id='subject'
                    {...register('subject', { required: 'Subject is required' })}
                    placeholder='Message subject'
                  />
                  {errors.subject && (
                    <p className='text-sm text-gray-600'>{errors.subject.message}</p>
                  )}
                </div>

                <div className='space-y-2'>
                  <label htmlFor='message' className='text-sm font-medium'>
                    Message
                  </label>
                  <Textarea
                    id='message'
                    {...register('message', { required: 'Message is required' })}
                    placeholder='Your message'
                    rows={6}
                  />
                  {errors.message && (
                    <p className='text-sm text-gray-600'>{errors.message.message}</p>
                  )}
                </div>

                <Button type='submit' className='w-full' disabled={isSubmitting}>
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </Button>
              </form>
            </div>

            <div>
              <h2 className='mb-6 text-2xl font-semibold'>Contact Information</h2>

              <div className='grid gap-4'>
                <Card>
                  <CardContent className='flex items-start gap-4 p-6'>
                    <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground'>
                      <Mail className='h-5 w-5' />
                    </div>
                    <div>
                      <h3 className='font-medium'>Email</h3>
                      <p className='mt-1 text-sm text-muted-foreground'>For general inquiries:</p>
                      <a
                        href='mailto:hello@commonlyapp.com'
                        className='mt-1 block text-sm text-primary hover:underline'
                      >
                        hello@commonlyapp.com
                      </a>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className='flex items-start gap-4 p-6'>
                    <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground'>
                      <Phone className='h-5 w-5' />
                    </div>
                    <div>
                      <h3 className='font-medium'>Phone</h3>
                      <p className='mt-1 text-sm text-muted-foreground'>
                        Monday to Friday, 9am to 6pm EST:
                      </p>
                      <a
                        href='tel:+18722612607'
                        className='mt-1 block text-sm text-primary hover:underline'
                      >
                        +1 (872) 261-2607
                      </a>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className='mt-8 rounded-lg border bg-muted p-6'>
                <h3 className='mb-2 font-medium'>Project Submissions</h3>
                <p className='text-sm text-muted-foreground'>
                  For script or project submissions, please include a synopsis, relevant links, and
                  any supporting materials in your message.
                </p>
                <p className='mt-4 text-sm text-muted-foreground'>
                  Due to the volume of submissions, please allow 4-6 weeks for a response.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;
