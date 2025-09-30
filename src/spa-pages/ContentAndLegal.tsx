import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import SimpleHeader from '@/components/layout/SimpleHeader';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Calendar,
  Clock,
  ArrowRight,
  Tag,
  User,
  MapPin,
  Users,
  DollarSign,
  Building,
  Heart,
  Zap,
  Globe,
  Coffee,
  Laptop,
  Shield,
  FileText,
  Mail,
  AlertTriangle,
  Cookie,
  Settings,
  Info,
  Book,
  Video,
  Star,
  ChevronRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BlogPost {
  id: string;
  title: string;
  excerpt?: string | undefined;
  author_name: string;
  published_date: string;
  read_time: string;
  category: string;
  featured: boolean;
  slug?: string | undefined;
  image_url?: string | undefined;
  tags?: string[] | undefined;
}

interface JobListing {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  description: string;
  requirements: string[];
  salary_range: string;
  is_remote: boolean;
  is_active: boolean;
  created_at: string;
}

const ContentAndLegal = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') || 'blog';

  const [selectedCategory, setSelectedCategory] = useState('All Posts');
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<string[]>(['All Posts']);
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      setLoading(true);

      // Fetch blog posts
      const { data: postsData, error: postsError } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('status', 'published')
        .order('published_date', { ascending: false });

      if (postsError) throw postsError;

      setBlogPosts(postsData || []);

      // Extract unique categories from posts
      const uniqueCategories = [
        'All Posts',
          ...new Set((postsData || []).map(post => post.category)),
      ];
      setCategories(uniqueCategories);

      // Fetch job listings
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (jobsError) throw jobsError;

      setJobs(jobsData || []);
    } catch (error) {
      toast.error('Failed to load content');
      setBlogPosts([]);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts =
    selectedCategory === 'All Posts'
      ? blogPosts
      : blogPosts.filter(post => post.category === selectedCategory);

  const featuredPost = blogPosts.find(post => post.featured);

  const benefits = [
    {
      icon: Heart,
      title: 'Health & Wellness',
      description: 'Comprehensive health, dental, and vision insurance',
    },
    {
      icon: Laptop,
      title: 'Remote Work',
      description: 'Flexible remote work options and modern equipment',
    },
    {
      icon: Zap,
      title: 'Growth Opportunities',
      description: 'Learning budget and career development programs',
    },
    {
      icon: Globe,
      title: 'Global Impact',
      description: 'Work on products used by creators worldwide',
    },
    {
      icon: Coffee,
      title: 'Work-Life Balance',
      description: 'Unlimited PTO and flexible working hours',
    },
    {
      icon: Building,
      title: 'Equity Package',
      description: 'Competitive equity package for all employees',
    },
  ];

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return '1 day ago';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 14) return '1 week ago';
    return `${Math.floor(diffInDays / 7)} weeks ago`;
  };

  return (
    <div className='flex min-h-screen flex-col'>
      <SimpleHeader />

      <main className='flex-1 container max-w-screen-xl mx-auto px-4 py-12'>
        <div className='max-w-6xl mx-auto'>
          <h1 className='text-4xl font-bold tracking-tight mb-6'>Content & Legal</h1>
          <p className='text-xl text-muted-foreground mb-8'>
            Everything you need to know about our platform, policies, and opportunities.
          </p>

          <Tabs defaultValue={tabFromUrl} className='w-full'>
            <TabsList className='grid w-full grid-cols-2 lg:grid-cols-6'>
              <TabsTrigger value='blog'>Blog</TabsTrigger>
              <TabsTrigger value='guidelines'>Guidelines</TabsTrigger>
              <TabsTrigger value='careers'>Careers</TabsTrigger>
              <TabsTrigger value='privacy'>Privacy Policy</TabsTrigger>
              <TabsTrigger value='terms'>Terms of Service</TabsTrigger>
              <TabsTrigger value='cookies'>Cookie Policy</TabsTrigger>
            </TabsList>

            {/* Blog Tab */}
            <TabsContent value='blog' className='mt-6 space-y-6'>
              <div>
                <h2 className='text-2xl font-bold mb-4'>Commonly Blog</h2>
                <p className='text-muted-foreground mb-6'>
                  Insights, stories, and tips from the world of events and community building.
                </p>
              </div>

              {/* Featured Post */}
              {featuredPost && (
                <Card>
                  <CardContent className='p-6'>
                    <div className='grid lg:grid-cols-2 gap-8 items-center'>
                      <div className='aspect-video bg-muted rounded-lg animate-pulse' />
                      <div>
                        <Badge className='mb-4'>Featured</Badge>
                        <h3 className='text-2xl font-bold mb-4'>
                          <Link
                            to={`/blog/${featuredPost.id}`}
                            className='hover:text-primary transition-colors'
                          >
                            {featuredPost.title}
                          </Link>
                        </h3>
                        <p className='text-muted-foreground mb-6'>{featuredPost.excerpt}</p>
                        <div className='flex items-center gap-4 text-sm text-muted-foreground mb-6'>
                          <div className='flex items-center gap-1'>
                            <User className='h-4 w-4' />
                            <span>{featuredPost.author_name}</span>
                          </div>
                          <div className='flex items-center gap-1'>
                            <Calendar className='h-4 w-4' />
                            <span>{new Date(featuredPost.published_date).toLocaleDateString()}</span>
                          </div>
                          <div className='flex items-center gap-1'>
                            <Clock className='h-4 w-4' />
                            <span>{featuredPost.read_time}</span>
                          </div>
                        </div>
                        <Button asChild>
                          <Link to={`/blog/${featuredPost.id}`}>
                            Read More <ArrowRight className='ml-2 h-4 w-4' />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Categories */}
              <div className='flex flex-wrap gap-2'>
                {categories.map(category => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? 'default' : 'outline'}
                    size='sm'
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </Button>
                ))}
              </div>

              {/* Blog Posts Grid */}
              <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-6'>
                {filteredPosts.map(post => (
                  <Card key={post.id} className='h-full hover:shadow-lg transition-shadow'>
                    <div className='aspect-video bg-muted animate-pulse rounded-t-lg' />
                    <CardHeader>
                      <div className='flex items-center gap-2 mb-2'>
                        <Badge variant='secondary' className='text-xs'>
                          <Tag className='h-3 w-3 mr-1' />
                          {post.category}
                        </Badge>
                      </div>
                      <CardTitle className='line-clamp-2'>
                        <Link
                          to={`/blog/${post.id}`}
                          className='hover:text-primary transition-colors'
                        >
                          {post.title}
                        </Link>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className='line-clamp-3 mb-4'>{post.excerpt}</CardDescription>
                      <div className='flex items-center justify-between text-sm text-muted-foreground'>
                        <div className='flex items-center gap-1'>
                          <User className='h-3 w-3' />
                          <span>{post.author_name}</span>
                        </div>
                        <div className='flex items-center gap-1'>
                          <Clock className='h-3 w-3' />
                          <span>{post.read_time}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredPosts.length === 0 && (
                <div className='text-center py-12'>
                  <p className='text-muted-foreground'>No posts found in this category.</p>
                </div>
              )}
            </TabsContent>

            {/* Guidelines Tab */}
            <TabsContent value='guidelines' className='mt-6 space-y-6'>
              <div>
                <h2 className='text-2xl font-bold mb-4'>Community Guidelines</h2>
                <p className='text-muted-foreground mb-6'>
                  These guidelines help ensure Commonly remains a safe, inclusive, and inspiring
                  platform for everyone. By using our platform, you agree to follow these guidelines.
                </p>
              </div>

              <Alert>
                <Shield className='h-4 w-4' />
                <AlertTitle>Our Commitment</AlertTitle>
                <AlertDescription>
                  We're committed to fostering a community that celebrates creativity, diversity, and
                  mutual respect. These guidelines reflect our values and help maintain a positive
                  environment for all users.
                </AlertDescription>
              </Alert>

              <Tabs defaultValue='general' className='w-full'>
                <TabsList className='grid w-full grid-cols-3'>
                  <TabsTrigger value='general'>General Guidelines</TabsTrigger>
                  <TabsTrigger value='content'>Content Standards</TabsTrigger>
                  <TabsTrigger value='enforcement'>Enforcement</TabsTrigger>
                </TabsList>

                <TabsContent value='general' className='mt-6 space-y-6'>
                  <Card>
                    <CardHeader>
                      <CardTitle className='flex items-center gap-2'>
                        <Heart className='h-5 w-5 text-primary' />
                        Be Respectful and Kind
                      </CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                      <p>
                        Treat everyone with respect, regardless of their background, beliefs, or
                        opinions.
                      </p>
                      <ul className='list-disc pl-6 space-y-2'>
                        <li>No harassment, bullying, or intimidation of any kind</li>
                        <li>
                          No hate speech or discriminatory language based on race, ethnicity,
                          religion, gender, sexual orientation, disability, or other protected
                          characteristics
                        </li>
                        <li>Constructive criticism is welcome, but personal attacks are not</li>
                        <li>Respect boundaries and consent in all interactions</li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className='flex items-center gap-2'>
                        <Users className='h-5 w-5 text-primary' />
                        Build Authentic Connections
                      </CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                      <p>Create genuine relationships and contribute positively to the community.</p>
                      <ul className='list-disc pl-6 space-y-2'>
                        <li>
                          Be yourself - use your real identity when creating events or interacting
                        </li>
                        <li>Don't impersonate others or create fake accounts</li>
                        <li>Share accurate information about events and experiences</li>
                        <li>Support fellow community members and celebrate their successes</li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className='flex items-center gap-2'>
                        <Shield className='h-5 w-5 text-primary' />
                        Protect Privacy and Safety
                      </CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                      <p>Respect everyone's privacy and help maintain a safe environment.</p>
                      <ul className='list-disc pl-6 space-y-2'>
                        <li>Don't share others' personal information without consent</li>
                        <li>Respect intellectual property rights</li>
                        <li>Report suspicious or harmful behavior</li>
                        <li>
                          Keep children safe - no exploitation or inappropriate content involving
                          minors
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value='content' className='mt-6 space-y-6'>
                  <Card>
                    <CardHeader>
                      <CardTitle className='flex items-center gap-2'>
                        <FileText className='h-5 w-5 text-primary' />
                        Event Content Standards
                      </CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                      <p>When creating events or content, ensure it meets our community standards:</p>
                      <div className='space-y-4'>
                        <div>
                          <h4 className='font-semibold text-gray-800 mb-2'>✓ Allowed Content</h4>
                          <ul className='list-disc pl-6 space-y-1 text-sm'>
                            <li>Educational workshops and seminars</li>
                            <li>Music concerts and performances</li>
                            <li>Community gatherings and meetups</li>
                            <li>Art exhibitions and cultural events</li>
                            <li>Charity and fundraising events</li>
                            <li>Professional networking events</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className='font-semibold text-gray-800 mb-2'>✗ Prohibited Content</h4>
                          <ul className='list-disc pl-6 space-y-1 text-sm'>
                            <li>Illegal activities or substances</li>
                            <li>Violence or dangerous activities</li>
                            <li>Adult or sexually explicit content</li>
                            <li>Misleading or fraudulent events</li>
                            <li>Spam or repetitive content</li>
                            <li>Pyramid schemes or multi-level marketing</li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value='enforcement' className='mt-6 space-y-6'>
                  <Card>
                    <CardHeader>
                      <CardTitle className='flex items-center gap-2'>
                        <AlertTriangle className='h-5 w-5 text-primary' />
                        Violation Consequences
                      </CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                      <p>We take violations seriously and may take the following actions:</p>
                      <div className='space-y-4'>
                        <div>
                          <h4 className='font-semibold mb-2'>First Violation</h4>
                          <p className='text-sm text-muted-foreground'>
                            Warning and content removal if applicable
                          </p>
                        </div>
                        <div>
                          <h4 className='font-semibold mb-2'>Repeated Violations</h4>
                          <p className='text-sm text-muted-foreground'>
                            Temporary suspension of account privileges
                          </p>
                        </div>
                        <div>
                          <h4 className='font-semibold mb-2'>Severe Violations</h4>
                          <p className='text-sm text-muted-foreground'>
                            Permanent account termination and potential legal action
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Reporting Violations</CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                      <p>Help us maintain a safe community by reporting violations:</p>
                      <ul className='list-disc pl-6 space-y-2'>
                        <li>Use the report button on any content or profile</li>
                        <li>Contact our support team directly</li>
                        <li>Provide specific details and evidence when reporting</li>
                        <li>False reports may result in action against your account</li>
                      </ul>
                      <Alert className='mt-4'>
                        <Mail className='h-4 w-4' />
                        <AlertDescription>
                          For urgent safety concerns, contact us immediately at safety@commonly.app
                        </AlertDescription>
                      </Alert>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </TabsContent>

            {/* Careers Tab */}
            <TabsContent value='careers' className='mt-6 space-y-6'>
              <div>
                <h2 className='text-2xl font-bold mb-4'>Join the Commonly Team</h2>
                <p className='text-muted-foreground mb-6'>
                  Help us build the future of events, music, and community. We're looking for passionate
                  people who want to make a difference.
                </p>
              </div>

              {/* Benefits Section */}
              <div>
                <h3 className='text-xl font-semibold mb-6'>Why Work at Commonly?</h3>
                <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8'>
                  {benefits.map((benefit, index) => {
                    const Icon = benefit.icon;
                    return (
                      <Card key={index}>
                        <CardHeader className='text-center'>
                          <div className='mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4'>
                            <Icon className='h-6 w-6 text-primary' />
                          </div>
                          <CardTitle>{benefit.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className='text-muted-foreground text-center'>{benefit.description}</p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              <Separator />

              {/* Job Listings */}
              <div>
                <h3 className='text-xl font-semibold mb-6'>Open Positions</h3>

                {loading ? (
                  <div className='text-center py-12'>
                    <p className='text-muted-foreground'>Loading positions...</p>
                  </div>
                ) : jobs.length === 0 ? (
                  <div className='text-center py-12'>
                    <p className='text-muted-foreground mb-4'>No open positions at the moment.</p>
                    <p className='text-sm text-muted-foreground'>
                      Check back soon or send us your resume for future opportunities.
                    </p>
                    <Button className='mt-4' variant='outline'>
                      Send Resume
                    </Button>
                  </div>
                ) : (
                  <div className='grid gap-6'>
                    {jobs.map(job => (
                      <Card key={job.id} className='hover:shadow-lg transition-shadow'>
                        <CardHeader>
                          <div className='flex justify-between items-start'>
                            <div>
                              <CardTitle className='text-xl'>{job.title}</CardTitle>
                              <CardDescription className='text-lg'>{job.department}</CardDescription>
                            </div>
                            <Badge variant={job.type === 'Full-time' ? 'default' : 'secondary'}>
                              {job.type}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className='flex flex-wrap gap-2 mb-4'>
                            <Badge variant='outline'>
                              <MapPin className='mr-1 h-3 w-3' />
                              {job.location}
                            </Badge>
                            {job.is_remote && (
                              <Badge variant='outline'>
                                <Globe className='mr-1 h-3 w-3' />
                                Remote OK
                              </Badge>
                            )}
                            <Badge variant='outline'>
                              <Clock className='mr-1 h-3 w-3' />
                              {getTimeAgo(job.created_at)}
                            </Badge>
                            <Badge variant='outline'>
                              <DollarSign className='mr-1 h-3 w-3' />
                              {job.salary_range}
                            </Badge>
                          </div>

                          <p className='text-muted-foreground mb-4'>{job.description}</p>

                          {job.requirements && job.requirements.length > 0 && (
                            <div className='mb-4'>
                              <h4 className='font-medium mb-2'>Key Requirements:</h4>
                              <ul className='text-sm text-muted-foreground space-y-1'>
                                {job.requirements.map((req, index) => (
                                  <li key={index} className='flex items-center'>
                                    <span className='w-1.5 h-1.5 bg-primary rounded-full mr-2' />
                                    {req}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          <div className='flex justify-between items-center'>
                            <Button>Apply Now</Button>
                            <Button variant='ghost' size='sm'>
                              Learn More
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Contact Section */}
              <Card className='bg-muted'>
                <CardContent className='p-8 text-center'>
                  <h3 className='text-xl font-semibold mb-4'>Don't See the Right Role?</h3>
                  <p className='text-muted-foreground mb-6 max-w-2xl mx-auto'>
                    We're always looking for talented people to join our team. Send us your resume and let
                    us know how you'd like to contribute.
                  </p>
                  <Button size='lg'>Get in Touch</Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Privacy Policy Tab */}
            <TabsContent value='privacy' className='mt-6 space-y-6'>
              <div>
                <h2 className='text-2xl font-bold mb-4'>Privacy Policy</h2>
                <p className='text-muted-foreground mb-2'>
                  Last updated:{' '}
                  {new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  }) as string}
                </p>
              </div>

              <div className='space-y-6'>
                <Card>
                  <CardHeader>
                    <CardTitle>1. Information We Collect</CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    <div>
                      <h4 className='font-semibold mb-2'>Personal Information</h4>
                      <p className='text-muted-foreground'>
                        We collect information you provide directly to us, such as when you create an
                        account, make a purchase, attend an event, or contact us for support. This may
                        include:
                      </p>
                      <ul className='list-disc list-inside text-muted-foreground mt-2 space-y-1'>
                        <li>Name, email address, and contact information</li>
                        <li>Payment information (processed securely through Stripe)</li>
                        <li>Profile information and preferences</li>
                        <li>Event attendance and participation data</li>
                        <li>Communications and feedback</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className='font-semibold mb-2'>Usage Information</h4>
                      <p className='text-muted-foreground'>
                        We automatically collect certain information about your use of our platform,
                        including:
                      </p>
                      <ul className='list-disc list-inside text-muted-foreground mt-2 space-y-1'>
                        <li>Device information and browser type</li>
                        <li>IP address and location data</li>
                        <li>Pages visited and features used</li>
                        <li>Time spent on the platform</li>
                        <li>Search queries and interactions</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>2. How We Use Your Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className='text-muted-foreground mb-4'>
                      We use the information we collect to provide, maintain, and improve our services,
                      including:
                    </p>
                    <ul className='list-disc list-inside text-muted-foreground space-y-2'>
                      <li>Creating and managing your account</li>
                      <li>Processing payments and transactions</li>
                      <li>Facilitating event bookings and attendance</li>
                      <li>Personalizing your experience and recommendations</li>
                      <li>Communicating with you about our services</li>
                      <li>Analyzing usage patterns to improve our platform</li>
                      <li>Detecting and preventing fraud or abuse</li>
                      <li>Complying with legal obligations</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>3. Information Sharing</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className='text-muted-foreground mb-4'>
                      We do not sell, trade, or rent your personal information to third parties. We may
                      share your information in the following circumstances:
                    </p>
                    <ul className='list-disc list-inside text-muted-foreground space-y-2'>
                      <li>
                        <strong>Service Providers:</strong> With trusted third-party services that help
                        us operate our platform
                      </li>
                      <li>
                        <strong>Event Organizers:</strong> When you register for events, we share
                        necessary information with organizers
                      </li>
                      <li>
                        <strong>Legal Requirements:</strong> When required by law or to protect our
                        rights and safety
                      </li>
                      <li>
                        <strong>Business Transfers:</strong> In connection with mergers, acquisitions,
                        or asset sales
                      </li>
                      <li>
                        <strong>With Your Consent:</strong> When you explicitly agree to share
                        information
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>4. Your Rights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className='text-muted-foreground mb-4'>
                      You have the following rights regarding your personal information:
                    </p>
                    <ul className='list-disc list-inside text-muted-foreground space-y-2'>
                      <li>
                        <strong>Access:</strong> Request access to your personal information
                      </li>
                      <li>
                        <strong>Correction:</strong> Update or correct inaccurate information
                      </li>
                      <li>
                        <strong>Deletion:</strong> Request deletion of your personal information
                      </li>
                      <li>
                        <strong>Portability:</strong> Request a copy of your data in a portable format
                      </li>
                      <li>
                        <strong>Opt-out:</strong> Unsubscribe from marketing communications
                      </li>
                      <li>
                        <strong>Restriction:</strong> Request limitation of processing
                      </li>
                    </ul>
                    <p className='text-muted-foreground mt-4'>
                      To exercise these rights, please contact us at privacy@commonly.app
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>5. Contact Us</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className='text-muted-foreground mb-4'>
                      If you have any questions about this Privacy Policy or our privacy practices,
                      please contact us:
                    </p>
                    <div className='text-muted-foreground space-y-1'>
                      <p>
                        <strong>Email:</strong> privacy@commonly.app
                      </p>
                      <p>
                        <strong>Mail:</strong> Commonly Privacy Team, 123 Main Street, San Francisco, CA
                        94102
                      </p>
                      <p>
                        <strong>Phone:</strong> +1 (555) 123-4567
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Terms of Service Tab */}
            <TabsContent value='terms' className='mt-6 space-y-6'>
              <div>
                <h2 className='text-2xl font-bold mb-4'>Terms of Service</h2>
                <p className='text-muted-foreground mb-2'>
                  Last updated:{' '}
                  {new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  }) as string}
                </p>
              </div>

              <div className='space-y-6'>
                <Card>
                  <CardHeader>
                    <CardTitle>1. Acceptance of Terms</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className='text-muted-foreground'>
                      By accessing and using Commonly ("the Platform"), you accept and agree to be bound
                      by these Terms of Service ("Terms"). If you do not agree to these Terms, please do
                      not use our Platform. These Terms apply to all users, including event organizers,
                      attendees, content creators, and visitors.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>2. Description of Service</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className='text-muted-foreground mb-4'>
                      Commonly is a community platform that enables users to:
                    </p>
                    <ul className='list-disc list-inside text-muted-foreground space-y-2'>
                      <li>Create, discover, and attend events</li>
                      <li>Buy and sell products and services</li>
                      <li>Create and participate in community projects</li>
                      <li>Connect with artists and creators</li>
                      <li>Access podcasts and digital content</li>
                      <li>Promote content and services</li>
                      <li>Engage with other community members</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>3. User Conduct</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className='text-muted-foreground mb-4'>You agree not to use the Platform to:</p>
                    <ul className='list-disc list-inside text-muted-foreground space-y-2'>
                      <li>Violate any applicable laws or regulations</li>
                      <li>Harass, abuse, or harm other users</li>
                      <li>Post false, misleading, or fraudulent content</li>
                      <li>Infringe on intellectual property rights</li>
                      <li>Distribute spam, malware, or harmful content</li>
                      <li>Engage in unauthorized commercial activities</li>
                      <li>Attempt to hack or disrupt our services</li>
                      <li>Create fake accounts or impersonate others</li>
                      <li>Share inappropriate or offensive content</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>4. Disclaimers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className='text-muted-foreground mb-4'>
                      THE PLATFORM IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. WE DISCLAIM ALL
                      WARRANTIES, EXPRESS OR IMPLIED, INCLUDING:
                    </p>
                    <ul className='list-disc list-inside text-muted-foreground space-y-2'>
                      <li>Warranties of merchantability and fitness for a particular purpose</li>
                      <li>Warranties regarding accuracy, reliability, or completeness</li>
                      <li>Warranties that the service will be uninterrupted or error-free</li>
                      <li>Warranties regarding third-party content or services</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>5. Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className='text-muted-foreground mb-4'>
                      If you have questions about these Terms of Service, please contact us:
                    </p>
                    <div className='text-muted-foreground space-y-1'>
                      <p>
                        <strong>Email:</strong> legal@commonly.app
                      </p>
                      <p>
                        <strong>Mail:</strong> Commonly Legal Team, 123 Main Street, San Francisco, CA
                        94102
                      </p>
                      <p>
                        <strong>Phone:</strong> +1 (555) 123-4567
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Cookie Policy Tab */}
            <TabsContent value='cookies' className='mt-6 space-y-6'>
              <div>
                <h2 className='text-2xl font-bold mb-4'>Cookie Policy</h2>
                <p className='text-muted-foreground mb-2'>
                  Last updated:{' '}
                  {new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  }) as string}
                </p>
              </div>

              <Alert>
                <Cookie className='h-4 w-4' />
                <AlertTitle>About Cookies</AlertTitle>
                <AlertDescription>
                  This policy explains how we use cookies and similar technologies to provide,
                  improve, and protect our services. By using Commonly, you consent to our use of
                  cookies as described in this policy.
                </AlertDescription>
              </Alert>

              <Tabs defaultValue='overview' className='w-full'>
                <TabsList className='grid w-full grid-cols-2 lg:grid-cols-4'>
                  <TabsTrigger value='overview'>Overview</TabsTrigger>
                  <TabsTrigger value='types'>Cookie Types</TabsTrigger>
                  <TabsTrigger value='purposes'>How We Use</TabsTrigger>
                  <TabsTrigger value='control'>Your Control</TabsTrigger>
                </TabsList>

                <TabsContent value='overview' className='mt-6 space-y-6'>
                  <Card>
                    <CardHeader>
                      <CardTitle className='flex items-center gap-2'>
                        <Info className='h-5 w-5 text-primary' />
                        What Are Cookies?
                      </CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                      <p>
                        Cookies are small text files that are stored on your device when you visit a
                        website. They help websites remember information about your visit, such as
                        your preferred language and other settings, which can make your next visit
                        easier and the site more useful to you.
                      </p>
                      <p>
                        We use cookies and similar technologies (like web beacons, pixels, and local
                        storage) to provide, protect, and improve our services. This includes
                        personalizing content, tailoring and measuring ads, and providing a safer
                        experience.
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Why We Use Cookies</CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                      <p>We use cookies for several important reasons:</p>
                      <ul className='list-disc pl-6 space-y-2'>
                        <li>
                          <strong>Security:</strong> To protect your account and detect malicious
                          activity
                        </li>
                        <li>
                          <strong>Functionality:</strong> To remember your preferences and settings
                        </li>
                        <li>
                          <strong>Performance:</strong> To understand how you use our service and
                          improve it
                        </li>
                        <li>
                          <strong>Analytics:</strong> To measure and analyze usage patterns
                        </li>
                        <li>
                          <strong>Personalization:</strong> To show you relevant content and
                          recommendations
                        </li>
                        <li>
                          <strong>Advertising:</strong> To deliver relevant ads and measure their
                          effectiveness
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value='types' className='mt-6 space-y-6'>
                  <Card>
                    <CardHeader>
                      <CardTitle className='flex items-center gap-2'>
                        <Shield className='h-5 w-5 text-primary' />
                        Essential Cookies
                      </CardTitle>
                      <CardDescription>Required for basic website functionality</CardDescription>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                      <p>
                        These cookies are necessary for the website to function and cannot be switched
                        off. They are usually only set in response to actions made by you which amount
                        to a request for services.
                      </p>
                      <div className='grid md:grid-cols-2 gap-4 mt-4'>
                        <div>
                          <h4 className='font-semibold mb-2'>Authentication</h4>
                          <ul className='text-sm space-y-1'>
                            <li>• Login session management</li>
                            <li>• User authentication tokens</li>
                            <li>• Security verification</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className='font-semibold mb-2'>Functionality</h4>
                          <ul className='text-sm space-y-1'>
                            <li>• Shopping cart contents</li>
                            <li>• Form data retention</li>
                            <li>• Language preferences</li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Performance Cookies</CardTitle>
                      <CardDescription>
                        Help us understand how visitors interact with our website
                      </CardDescription>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                      <p>
                        These cookies collect information about how you use our website, such as which
                        pages you visit most often and if you get error messages from web pages.
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Functional Cookies</CardTitle>
                      <CardDescription>
                        Enable enhanced functionality and personalization
                      </CardDescription>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                      <p>
                        These cookies allow the website to remember choices you make and provide
                        enhanced, more personal features.
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value='purposes' className='mt-6 space-y-6'>
                  <Card>
                    <CardHeader>
                      <CardTitle>Specific Cookie Uses</CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-6'>
                      <div>
                        <h4 className='font-semibold mb-3'>Authentication & Security</h4>
                        <div className='bg-muted p-4 rounded-lg'>
                          <ul className='space-y-2 text-sm'>
                            <li>
                              <strong>auth_token:</strong> Maintains your login session (Session
                              cookie)
                            </li>
                            <li>
                              <strong>csrf_token:</strong> Protects against cross-site request forgery
                              attacks (Session cookie)
                            </li>
                            <li>
                              <strong>remember_me:</strong> Keeps you logged in across browser
                              sessions (30 days)
                            </li>
                          </ul>
                        </div>
                      </div>

                      <div>
                        <h4 className='font-semibold mb-3'>User Preferences</h4>
                        <div className='bg-muted p-4 rounded-lg'>
                          <ul className='space-y-2 text-sm'>
                            <li>
                              <strong>theme_preference:</strong> Remembers your dark/light mode choice
                              (1 year)
                            </li>
                            <li>
                              <strong>language:</strong> Stores your preferred language setting (1
                              year)
                            </li>
                            <li>
                              <strong>notification_settings:</strong> Remembers your notification
                              preferences (1 year)
                            </li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value='control' className='mt-6 space-y-6'>
                  <Card>
                    <CardHeader>
                      <CardTitle className='flex items-center gap-2'>
                        <Settings className='h-5 w-5 text-primary' />
                        Managing Your Cookie Preferences
                      </CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                      <p>You have several options to control and manage cookies:</p>

                      <div className='space-y-4'>
                        <div>
                          <h4 className='font-semibold mb-2'>Browser Settings</h4>
                          <p className='text-sm text-muted-foreground mb-2'>
                            Most browsers allow you to:
                          </p>
                          <ul className='list-disc pl-6 space-y-1 text-sm'>
                            <li>View cookies that have been set and delete them individually</li>
                            <li>Block third-party cookies</li>
                            <li>Block cookies from particular sites</li>
                            <li>Block all cookies from being set</li>
                            <li>Delete all cookies when you close your browser</li>
                          </ul>
                        </div>

                        <div>
                          <h4 className='font-semibold mb-2'>Our Cookie Preferences</h4>
                          <p className='text-sm text-muted-foreground mb-3'>
                            You can manage your cookie preferences for our site:
                          </p>
                          <Button className='mb-4'>Manage Cookie Preferences</Button>
                          <p className='text-xs text-muted-foreground'>
                            Note: Disabling certain cookies may affect the functionality of our
                            website.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              <Card className='bg-muted'>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Cookie className='h-5 w-5 text-primary' />
                    Questions About Cookies?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className='mb-4'>
                    If you have any questions about our use of cookies or this Cookie Policy, please
                    contact us:
                  </p>
                  <ul className='space-y-2'>
                    <li>
                      <strong>Email:</strong>{' '}
                      <a
                        href='mailto:privacy@commonly.app'
                        className='text-primary hover:underline'
                      >
                        privacy@commonly.app
                      </a>
                    </li>
                    <li>
                      <strong>Support:</strong>{' '}
                      <a
                        href='mailto:support@commonly.app'
                        className='text-primary hover:underline'
                      >
                        support@commonly.app
                      </a>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ContentAndLegal;