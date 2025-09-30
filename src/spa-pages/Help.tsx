import React, { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import {
  realHelpService,
  HelpArticle,
  FAQCategory,
  SiteSettings,
} from '@/services/realHelpService';
import SimpleHeader from '@/components/layout/SimpleHeader';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Search,
  MessageCircle,
  Mail,
  Phone,
  Book,
  Video,
  Users,
  Calendar,
  ShoppingBag,
  CreditCard,
  Settings,
  Shield,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Star,
} from 'lucide-react';
import { toast } from 'sonner';

const Help = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [contactForm, setContactForm] = useState({
    ...(user && { name: user.name || '' }),
    ...(user && { email: user.email || '' }),
    subject: '',
    message: '',
    priority: 'medium',
  });

  const [articles, setArticles] = useState<HelpArticle[]>([]);

  const [categories, setCategories] = useState<FAQCategory[]>([]);

  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
    contact_email: 'hello@commonlyapp.com',
    contact_phone: '+1 (872) 261-2607',
    support_hours: 'Monday to Friday, 9am to 6pm EST',
    response_times: {
      general: '24 hours',
      technical: '12 hours',
      payment: '4 hours',
      urgent: '1 hour',
    },

  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHelpData = async () => {
      try {
        setLoading(true);
        const [helpArticles, faqCategories, settings] = await Promise.all([
          realHelpService.getHelpArticles(),
          realHelpService.getFAQCategories(),
          realHelpService.getSiteSettings(),
        ]);

        setArticles(helpArticles);
        setCategories([
          {
            id: 'all',
            name: 'All Topics',
            icon: 'Book',
            sort_order: 0,
            is_active: true,
            description: '',
          },
          ...faqCategories,
        ]);
        setSiteSettings(settings);
      } catch (error) {
        console.error('Error loading help data:', error);
        toast.error('Failed to load help content');
      } finally {
        setLoading(false);
      }
    };

    loadHelpData();

  }, []);

  const getIconComponent = (iconName?: string) => {
    switch (iconName) {
      case 'Calendar':
        return Calendar;
      case 'CreditCard':
        return CreditCard;
      case 'Settings':
        return Settings;
      case 'ShoppingBag':
        return ShoppingBag;
      case 'Users':
        return Users;
      case 'Shield':
        return Shield;
      default:
        return Book;
    }
  };

  const filteredArticles = articles.filter(article => {
    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const quickLinks = [
    { title: 'Getting Started Guide', url: '#', icon: Book },
    { title: 'Video Tutorials', url: '#', icon: Video },
    { title: 'Community Guidelines', url: '#', icon: Users },
    { title: 'Privacy Policy', url: '/privacy', icon: Shield },
    { title: 'Terms of Service', url: '/terms', icon: Book },
  ];

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!contactForm.subject || !contactForm.message) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const submission = await realHelpService.createContactSubmission(
        contactForm.name,
        contactForm.email,
        contactForm.subject,
        contactForm.message,
        'general_inquiry',
        contactForm.priority as 'low' | 'medium' | 'high' | 'urgent'
      );

      if (!submission) {
        throw new Error('Failed to create contact submission');
      }

      toast.success("Your message has been sent! We'll get back to you within 24 hours.");

      setContactForm({
          ...contactForm,
        subject: '',
        message: '',
      });
    } catch (error) {
      console.error('Error submitting contact form:', error);
      toast.error('Failed to send message. Please try again.');
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setContactForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className='flex min-h-screen flex-col bg-white text-[#2B2B2B]'>
      <SimpleHeader />

      <main className='flex-1 container mx-auto px-4 py-8'>
        <div className='max-w-6xl mx-auto'>
          {/* Header */}
          <div className='text-center mb-12'>
            <h1 className='text-4xl font-bold mb-4 text-[#2B2B2B]'>Help Center</h1>
            <p className='text-xl text-gray-600 mb-8'>
              Find answers to your questions and get support when you need it
            </p>

            {/* Search */}
            <div className='relative max-w-2xl mx-auto'>
              <Search className='absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400' />
              <Input
                placeholder='Search for help articles...'
                value={searchQuery}
                onChange={e => setSearchQuery((e.target as HTMLInputElement).value)}
                className='pl-12 h-14 text-lg border-gray-300 focus:border-[#2B2B2B]'
              />
            </div>
          </div>

          {/* Quick Links */}
          <div className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-12'>
            {quickLinks.map((link, index) => (
              <Card
                key={index}
                className='hover:shadow-md transition-shadow border border-gray-200'
              >
                <CardContent className='p-6 text-center'>
                  <link.icon className='h-8 w-8 mx-auto mb-3 text-[#2B2B2B]' />
                  <h3 className='font-medium text-[#2B2B2B] mb-2'>{link.title}</h3>
                  <Button variant='ghost' size='sm' className='text-gray-600 hover:text-[#2B2B2B]'>
                    View <ExternalLink className='h-3 w-3 ml-1' />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <Tabs defaultValue='faq' className='w-full'>
            <TabsList className='grid w-full grid-cols-3'>
              <TabsTrigger value='faq'>Frequently Asked Questions</TabsTrigger>
              <TabsTrigger value='contact'>Contact Support</TabsTrigger>
              <TabsTrigger value='resources'>Resources</TabsTrigger>
            </TabsList>

            {/* FAQ Tab */}
            <TabsContent value='faq' className='space-y-6'>
              {/* Category Filter */}
              <div className='flex flex-wrap gap-2'>
                {categories.map(category => {
                  const IconComponent = getIconComponent(category.icon);
                  return (
                    <Button
                      key={category.id || category.name}
                      variant={
                        selectedCategory === (category.id || category.name) ? 'default' : 'outline'
                      }
                      size='sm'
                      onClick={() => setSelectedCategory(category.id || category.name)}
                      className={
                        selectedCategory === (category.id || category.name)
                          ? 'bg-[#2B2B2B] hover:bg-gray-800 text-white'
                          : 'border-gray-300 text-[#2B2B2B] hover:bg-gray-50'
                      }
                    >
                      <IconComponent className='h-4 w-4 mr-2' />
                      {category.name}
                    </Button>
                  );
                })}
              </div>

              {/* FAQ Accordion */}
              <Card className='border border-gray-200'>
                <CardContent className='p-6'>
                  {loading ? (
                    <div className='text-center py-8'>
                      <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-[#2B2B2B] mx-auto'></div>
                      <p className='mt-4 text-gray-600'>Loading help articles...</p>
                    </div>
                  ) : (
                    <>
                      <Accordion type='single' collapsible className='w-full'>
                        {filteredArticles.map((article, index) => (
                          <AccordionItem key={article.id} value={`item-${index}`}>
                            <AccordionTrigger className='text-left text-[#2B2B2B] hover:text-gray-700'>
                              <div className='flex items-center gap-2'>
                                <Badge variant='outline' className='border-gray-300 text-gray-600'>
                                  {categories.find(c => (c.id || c.name) === article.category)
                                    ?.name || article.category}
                                </Badge>
                                {article.title}
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className='text-gray-600'>
                              <div dangerouslySetInnerHTML={{ __html: article.content }} />
                              {article.estimated_time && (
                                <p className='text-sm text-gray-500 mt-2'>
                                  Estimated reading time: {article.estimated_time}
                                </p>
                              )}
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>

                      {filteredArticles.length === 0 && (
                        <div className='text-center py-8'>
                          <HelpCircle className='h-12 w-12 text-gray-400 mx-auto mb-4' />
                          <h3 className='text-lg font-semibold text-[#2B2B2B] mb-2'>
                            No results found
                          </h3>
                          <p className='text-gray-600'>
                            Try adjusting your search or browse different categories
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Contact Tab */}
            <TabsContent value='contact' className='space-y-6'>
              <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
                {/* Contact Form */}
                <Card className='border border-gray-200'>
                  <CardHeader>
                    <CardTitle className='text-[#2B2B2B]'>Send us a message</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleContactSubmit} className='space-y-4'>
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <div>
                          <label className='text-sm font-medium text-[#2B2B2B] mb-2 block'>
                            Name
                          </label>
                          <Input
                            value={contactForm.name}
                            onChange={e => handleInputChange('name', (e.target as HTMLInputElement).value)}
                            className='border-gray-300 focus:border-[#2B2B2B]'
                          />
                        </div>
                        <div>
                          <label className='text-sm font-medium text-[#2B2B2B] mb-2 block'>
                            Email
                          </label>
                          <Input
                            type='email'
                            value={contactForm.email}
                            onChange={e => handleInputChange('email', (e.target as HTMLInputElement).value)}
                            className='border-gray-300 focus:border-[#2B2B2B]'
                          />
                        </div>
                      </div>

                      <div>
                        <label className='text-sm font-medium text-[#2B2B2B] mb-2 block'>
                          Subject *
                        </label>
                        <Input
                          value={contactForm.subject}
                          onChange={e => handleInputChange('subject', (e.target as HTMLInputElement).value)}
                          className='border-gray-300 focus:border-[#2B2B2B]'
                          required
                        />
                      </div>

                      <div>
                        <label className='text-sm font-medium text-[#2B2B2B] mb-2 block'>
                          Priority
                        </label>
                        <select
                          value={contactForm.priority}
                          onChange={e => handleInputChange('priority', (e.target as HTMLInputElement).value)}
                          className='w-full border border-gray-300 rounded-md px-3 py-2 focus:border-[#2B2B2B]'
                        >
                          <option value='low'>Low</option>
                          <option value='medium'>Medium</option>
                          <option value='high'>High</option>
                          <option value='urgent'>Urgent</option>
                        </select>
                      </div>

                      <div>
                        <label className='text-sm font-medium text-[#2B2B2B] mb-2 block'>
                          Message *
                        </label>
                        <Textarea
                          value={contactForm.message}
                          onChange={e => handleInputChange('message', e.target.value)}
                          rows={6}
                          className='border-gray-300 focus:border-[#2B2B2B]'
                          required
                        />
                      </div>

                      <Button
                        type='submit'
                        className='w-full bg-[#2B2B2B] hover:bg-gray-800 text-white'
                      >
                        Send Message
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                {/* Contact Info */}
                <div className='space-y-6'>
                  <Card className='border border-gray-200'>
                    <CardHeader>
                      <CardTitle className='text-[#2B2B2B]'>Other ways to reach us</CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                      <div className='flex items-center gap-3'>
                        <Mail className='h-5 w-5 text-[#2B2B2B]' />
                        <div>
                          <p className='font-medium text-[#2B2B2B]'>Email Support</p>
                          <p className='text-gray-600'>{siteSettings.contact_email}</p>
                          <p className='text-sm text-gray-500'>
                            Response within {siteSettings.response_times.general}
                          </p>
                        </div>
                      </div>

                      <div className='flex items-center gap-3'>
                        <Phone className='h-5 w-5 text-[#2B2B2B]' />
                        <div>
                          <p className='font-medium text-[#2B2B2B]'>Phone Support</p>
                          <p className='text-gray-600'>{siteSettings.contact_phone}</p>
                          <p className='text-sm text-gray-500'>{siteSettings.support_hours}</p>
                        </div>
                      </div>

                      <div className='flex items-center gap-3'>
                        <MessageCircle className='h-5 w-5 text-[#2B2B2B]' />
                        <div>
                          <p className='font-medium text-[#2B2B2B]'>Live Chat</p>
                          <p className='text-gray-600'>Available 24/7</p>
                          <Button
                            variant='outline'
                            size='sm'
                            className='mt-2 border-gray-300 text-[#2B2B2B] hover:bg-gray-50'
                          >
                            Start Chat
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className='border border-gray-200'>
                    <CardHeader>
                      <CardTitle className='text-[#2B2B2B]'>Response Times</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className='space-y-3'>
                        <div className='flex justify-between items-center'>
                          <span className='text-gray-600'>General Inquiries</span>
                          <Badge variant='secondary' className='bg-gray-100 text-gray-700'>
                            {siteSettings.response_times.general}
                          </Badge>
                        </div>
                        <div className='flex justify-between items-center'>
                          <span className='text-gray-600'>Technical Issues</span>
                          <Badge variant='secondary' className='bg-gray-100 text-gray-700'>
                            {siteSettings.response_times.technical}
                          </Badge>
                        </div>
                        <div className='flex justify-between items-center'>
                          <span className='text-gray-600'>Payment Issues</span>
                          <Badge variant='secondary' className='bg-gray-100 text-gray-700'>
                            {siteSettings.response_times.payment}
                          </Badge>
                        </div>
                        <div className='flex justify-between items-center'>
                          <span className='text-gray-600'>Urgent/Security</span>
                          <Badge variant='secondary' className='bg-gray-100 text-gray-700'>
                            {siteSettings.response_times.urgent}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Resources Tab */}
            <TabsContent value='resources' className='space-y-6'>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                <Card className='border border-gray-200'>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2 text-[#2B2B2B]'>
                      <Book className='h-5 w-5' />
                      User Guides
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className='space-y-2'>
                      <li>
                        <Button
                          variant='ghost'
                          className='w-full justify-start p-0 h-auto text-gray-600 hover:text-[#2B2B2B]'
                        >
                          <ChevronRight className='h-4 w-4 mr-2' />
                          Getting Started Guide
                        </Button>
                      </li>
                      <li>
                        <Button
                          variant='ghost'
                          className='w-full justify-start p-0 h-auto text-gray-600 hover:text-[#2B2B2B]'
                        >
                          <ChevronRight className='h-4 w-4 mr-2' />
                          Event Creation Tutorial
                        </Button>
                      </li>
                      <li>
                        <Button
                          variant='ghost'
                          className='w-full justify-start p-0 h-auto text-gray-600 hover:text-[#2B2B2B]'
                        >
                          <ChevronRight className='h-4 w-4 mr-2' />
                          Product Selling Guide
                        </Button>
                      </li>
                      <li>
                        <Button
                          variant='ghost'
                          className='w-full justify-start p-0 h-auto text-gray-600 hover:text-[#2B2B2B]'
                        >
                          <ChevronRight className='h-4 w-4 mr-2' />
                          Community Guidelines
                        </Button>
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className='border border-gray-200'>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2 text-[#2B2B2B]'>
                      <Video className='h-5 w-5' />
                      Video Tutorials
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className='space-y-2'>
                      <li>
                        <Button
                          variant='ghost'
                          className='w-full justify-start p-0 h-auto text-gray-600 hover:text-[#2B2B2B]'
                        >
                          <ChevronRight className='h-4 w-4 mr-2' />
                          Platform Overview (5 min)
                        </Button>
                      </li>
                      <li>
                        <Button
                          variant='ghost'
                          className='w-full justify-start p-0 h-auto text-gray-600 hover:text-[#2B2B2B]'
                        >
                          <ChevronRight className='h-4 w-4 mr-2' />
                          Creating Your First Event (8 min)
                        </Button>
                      </li>
                      <li>
                        <Button
                          variant='ghost'
                          className='w-full justify-start p-0 h-auto text-gray-600 hover:text-[#2B2B2B]'
                        >
                          <ChevronRight className='h-4 w-4 mr-2' />
                          Managing Payments (6 min)
                        </Button>
                      </li>
                      <li>
                        <Button
                          variant='ghost'
                          className='w-full justify-start p-0 h-auto text-gray-600 hover:text-[#2B2B2B]'
                        >
                          <ChevronRight className='h-4 w-4 mr-2' />
                          Building Your Community (10 min)
                        </Button>
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className='border border-gray-200'>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2 text-[#2B2B2B]'>
                      <Star className='h-5 w-5' />
                      Best Practices
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className='space-y-2'>
                      <li>
                        <Button
                          variant='ghost'
                          className='w-full justify-start p-0 h-auto text-gray-600 hover:text-[#2B2B2B]'
                        >
                          <ChevronRight className='h-4 w-4 mr-2' />
                          Event Marketing Tips
                        </Button>
                      </li>
                      <li>
                        <Button
                          variant='ghost'
                          className='w-full justify-start p-0 h-auto text-gray-600 hover:text-[#2B2B2B]'
                        >
                          <ChevronRight className='h-4 w-4 mr-2' />
                          Product Photography Guide
                        </Button>
                      </li>
                      <li>
                        <Button
                          variant='ghost'
                          className='w-full justify-start p-0 h-auto text-gray-600 hover:text-[#2B2B2B]'
                        >
                          <ChevronRight className='h-4 w-4 mr-2' />
                          Community Engagement
                        </Button>
                      </li>
                      <li>
                        <Button
                          variant='ghost'
                          className='w-full justify-start p-0 h-auto text-gray-600 hover:text-[#2B2B2B]'
                        >
                          <ChevronRight className='h-4 w-4 mr-2' />
                          Safety & Security Tips
                        </Button>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          {/* Still Need Help */}
          <Card className='mt-12 border border-gray-200'>
            <CardContent className='p-8 text-center'>
              <HelpCircle className='h-12 w-12 text-[#2B2B2B] mx-auto mb-4' />
              <h3 className='text-xl font-semibold text-[#2B2B2B] mb-2'>Still need help?</h3>
              <p className='text-gray-600 mb-6'>
                Can't find what you're looking for? Our support team is here to help you succeed.
              </p>
              <div className='flex flex-col sm:flex-row gap-4 justify-center'>
                <Button className='bg-[#2B2B2B] hover:bg-gray-800 text-white'>
                  <MessageCircle className='h-4 w-4 mr-2' />
                  Start Live Chat
                </Button>
                <Button
                  variant='outline'
                  className='border-gray-300 text-[#2B2B2B] hover:bg-gray-50'
                >
                  <Mail className='h-4 w-4 mr-2' />
                  Send Email
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );

};

export default Help;
