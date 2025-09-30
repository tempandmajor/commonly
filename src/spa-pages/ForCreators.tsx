import { Link, useNavigate } from 'react-router-dom';
import SimpleHeader from '@/components/layout/SimpleHeader';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/providers/AuthProvider';
import {
  ArrowRight,
  Calendar,
  Globe,
  Ticket,
  Users,
  DollarSign,
  BarChart3,
  Shield,
  Zap,
  Star,
  TrendingUp,
  CheckCircle,
  PlayCircle,
  MessageSquare,
  Camera,
  Megaphone,
  CreditCard,
  HeadphonesIcon,
} from 'lucide-react';
import { toast } from 'sonner';

const ForCreators = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCreateEventClick = () => {
    if (!user) {
      navigate('/login?redirect=/create');
      toast.info('Please sign in to create an event');
    } else {
      navigate('/create');
    }
  };

  const features = [
    {
      icon: Calendar,
      title: 'Event Creation & Management',
      description:
        'Create any type of event - workshops, conferences, meetups, virtual events, and more with our intuitive builder.',
      benefits: [
        'Drag-and-drop event builder',
        'Custom registration forms',
        'Automated reminders',
        'Real-time attendee management',
      ],
    },
    {
      icon: Ticket,
      title: 'Advanced Ticketing System',
      description:
        'Sell tickets with flexible pricing, early bird discounts, group rates, and VIP packages.',
      benefits: [
        'Multiple ticket types',
        'Dynamic pricing',
        'Promo codes & discounts',
        'Waitlist management',
      ],
    },
    {
      icon: DollarSign,
      title: 'Revenue & Monetization',
      description:
        'Maximize your earnings with multiple revenue streams and transparent fee structure.',
      benefits: [
        'Only 15% platform fee',
        'Instant payouts',
        'Merchandise sales',
        'Sponsorship opportunities',
      ],
    },
    {
      icon: BarChart3,
      title: 'Analytics & Insights',
      description:
        'Track your success with detailed analytics on sales, attendance, and audience engagement.',
      benefits: [
        'Real-time sales tracking',
        'Attendee demographics',
        'Revenue analytics',
        'Performance insights',
      ],
    },
    {
      icon: Users,
      title: 'Community Building',
      description:
        'Build lasting relationships with your audience through our integrated community features.',
      benefits: ['Follower system', 'Direct messaging', 'Community groups', 'Engagement tools'],
    },
    {
      icon: Megaphone,
      title: 'Marketing & Promotion',
      description: 'Reach more people with built-in marketing tools and promotional features.',
      benefits: [
        'Social media integration',
        'Email marketing',
        'SEO optimization',
        'Promotional campaigns',
      ],
    },
  ];

  const successStories = [
    {
      name: 'Sarah Chen',
      title: 'Workshop Creator',
      image:
        'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=64&h=64&fit=crop&crop=face',
      achievement: 'Generated $50K+ in revenue',
      quote:
        'Commonly helped me turn my passion for design into a thriving business. The platform makes it so easy to create and sell workshop tickets.',
    },
    {
      name: 'Marcus Rodriguez',
      title: 'Conference Organizer',
      image:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=face',
      achievement: 'Hosted 15+ successful events',
      quote:
        'The analytics and attendee management tools are incredible. I can focus on creating great content while Commonly handles the logistics.',
    },
    {
      name: 'Emily Johnson',
      title: 'Virtual Event Host',
      image:
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=64&h=64&fit=crop&crop=face',
      achievement: 'Built 10K+ follower community',
      quote:
        "Going virtual was seamless with Commonly's streaming integration. My audience has grown 300% since I started using the platform.",
    },
  ];

  const pricingBenefits = [
    'Only 15% platform fee (industry standard is 20-30%)',
    'No monthly subscription fees',
    'Free event creation and basic features',
    'Instant payouts to your bank account',
    'No hidden fees or setup costs',
  ];

  const eventTypes = [
    { name: 'Workshops & Classes', icon: '🎨' },
    { name: 'Conferences & Seminars', icon: '🎤' },
    { name: 'Networking Events', icon: '🤝' },
    { name: 'Virtual Events', icon: '💻' },
    { name: 'Community Meetups', icon: '👥' },
    { name: 'Product Launches', icon: '🚀' },
    { name: 'Fundraising Events', icon: '💰' },
    { name: 'Entertainment Shows', icon: '🎭' },
  ];

  return (
    <div className='flex min-h-screen flex-col bg-white text-[#2B2B2B]'>
      <SimpleHeader />

      <main className='flex-1'>
        {/* Hero Section */}
        <section className='py-20 px-4 bg-white'>
          <div className='container mx-auto max-w-6xl'>
            <div className='text-center'>
              <h1 className='text-4xl md:text-6xl font-bold mb-6 text-[#2B2B2B]'>
                Turn Your Ideas Into
                <span className='block'>Successful Events</span>
              </h1>
              <p className='text-xl text-gray-600 mb-8 max-w-3xl mx-auto'>
                Join thousands of creators who use Commonly to launch, promote, and monetize their
                events. From workshops to conferences, we provide everything you need to succeed.
              </p>
              <div className='flex flex-col sm:flex-row gap-4 justify-center mb-12'>
                <Button
                  size='lg'
                  onClick={handleCreateEventClick}
                  className='bg-[#2B2B2B] hover:bg-gray-800 text-white'
                >
                  Create Your First Event <ArrowRight className='ml-2 h-4 w-4' />
                </Button>
                <Button
                  variant='outline'
                  size='lg'
                  asChild
                  className='border-gray-300 text-[#2B2B2B] hover:bg-gray-50'
                >
                  <Link to='/creator-program'>Join Creator Program</Link>
                </Button>
              </div>

              {/* Stats */}
              <div className='grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto'>
                <div className='text-center'>
                  <div className='text-3xl font-bold text-[#2B2B2B]'>50K+</div>
                  <div className='text-gray-600'>Events Created</div>
                </div>
                <div className='text-center'>
                  <div className='text-3xl font-bold text-[#2B2B2B]'>$10M+</div>
                  <div className='text-gray-600'>Creator Earnings</div>
                </div>
                <div className='text-center'>
                  <div className='text-3xl font-bold text-[#2B2B2B]'>2M+</div>
                  <div className='text-gray-600'>Tickets Sold</div>
                </div>
                <div className='text-center'>
                  <div className='text-3xl font-bold text-[#2B2B2B]'>95%</div>
                  <div className='text-gray-600'>Creator Satisfaction</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Event Types */}
        <section className='py-16 px-4 bg-gray-50'>
          <div className='container mx-auto max-w-6xl'>
            <h2 className='text-3xl font-bold text-center mb-12 text-[#2B2B2B]'>
              Create Any Type of Event
            </h2>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-6'>
              {eventTypes.map((type, index) => (
                <Card
                  key={index}
                  className='text-center hover:shadow-md transition-shadow bg-white border border-gray-200'
                >
                  <CardContent className='p-6'>
                    <div className='text-4xl mb-3'>{type.icon}</div>
                    <h3 className='font-semibold text-[#2B2B2B]'>{type.name}</h3>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className='py-20 px-4 bg-white'>
          <div className='container mx-auto max-w-6xl'>
            <div className='text-center mb-16'>
              <h2 className='text-3xl font-bold mb-4 text-[#2B2B2B]'>
                Everything You Need to Succeed
              </h2>
              <p className='text-xl text-gray-600 max-w-3xl mx-auto'>
                Our comprehensive platform provides all the tools and features you need to create,
                promote, and manage successful events.
              </p>
            </div>

            <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-8'>
              {features.map((feature, index) => (
                <Card
                  key={index}
                  className='bg-white border border-gray-200 hover:shadow-md transition-shadow'
                >
                  <CardHeader>
                    <div className='flex items-center gap-3 mb-2'>
                      <div className='p-2 bg-gray-100 rounded-lg'>
                        <feature.icon className='h-6 w-6 text-[#2B2B2B]' />
                      </div>
                      <CardTitle className='text-lg text-[#2B2B2B]'>{feature.title}</CardTitle>
                    </div>
                    <CardDescription className='text-gray-600'>
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className='space-y-2'>
                      {feature.benefits.map((benefit, idx) => (
                        <li key={idx} className='flex items-center gap-2 text-sm'>
                          <CheckCircle className='h-4 w-4 text-primary flex-shrink-0' />
                          <span className='text-gray-700'>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className='py-20 px-4 bg-gray-50'>
          <div className='container mx-auto max-w-4xl'>
            <div className='text-center mb-12'>
              <h2 className='text-3xl font-bold mb-4 text-[#2B2B2B]'>
                Transparent, Creator-Friendly Pricing
              </h2>
              <p className='text-xl text-gray-600'>
                Keep more of what you earn with our industry-leading low fees
              </p>
            </div>

            <Card className='bg-white border border-gray-200'>
              <CardHeader className='text-center'>
                <CardTitle className='text-2xl text-[#2B2B2B]'>Simple, Fair Pricing</CardTitle>
                <CardDescription className='text-gray-600'>Only pay when you earn</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='text-center mb-8'>
                  <div className='text-5xl font-bold text-[#2B2B2B] mb-2'>15%</div>
                  <div className='text-xl text-gray-600'>Platform fee on ticket sales</div>
                  <div className='text-sm text-gray-500 mt-2'>Industry average is 20-30%</div>
                </div>

                <div className='grid md:grid-cols-2 gap-8'>
                  <div>
                    <h3 className='font-semibold mb-4 text-[#2B2B2B]'>What's Included:</h3>
                    <ul className='space-y-2'>
                      {pricingBenefits.map((benefit, index) => (
                        <li key={index} className='flex items-center gap-2'>
                          <CheckCircle className='h-4 w-4 text-primary flex-shrink-0' />
                          <span className='text-gray-700'>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className='bg-gray-50 p-6 rounded-lg'>
                    <h4 className='font-semibold mb-3 text-[#2B2B2B]'>Example Earnings:</h4>
                    <div className='space-y-3 text-sm'>
                      <div className='flex justify-between'>
                        <span className='text-gray-600'>Ticket Sales:</span>
                        <span className='font-medium'>$1,000</span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-gray-600'>Platform Fee (15%):</span>
                        <span className='font-medium'>-$150</span>
                      </div>
                      <div className='flex justify-between border-t pt-2 font-semibold text-[#2B2B2B]'>
                        <span>You Keep:</span>
                        <span>$850</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Success Stories */}
        <section className='py-20 px-4 bg-white'>
          <div className='container mx-auto max-w-6xl'>
            <div className='text-center mb-16'>
              <h2 className='text-3xl font-bold mb-4 text-[#2B2B2B]'>Creator Success Stories</h2>
              <p className='text-xl text-gray-600'>
                See how creators are building thriving businesses on Commonly
              </p>
            </div>

            <div className='grid md:grid-cols-3 gap-8'>
              {successStories.map((story, index) => (
                <Card
                  key={index}
                  className='bg-white border border-gray-200 hover:shadow-md transition-shadow'
                >
                  <CardHeader>
                    <div className='flex items-center gap-3'>
                      <img
                        src={story.image}
                        alt={story.name}
                        className='w-12 h-12 rounded-full object-cover'
                      />
                      <div>
                        <CardTitle className='text-lg text-[#2B2B2B]'>{story.name}</CardTitle>
                        <CardDescription className='text-gray-600'>{story.title}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Badge className='mb-4 bg-black text-white'>{story.achievement}</Badge>
                    <blockquote className='text-gray-700 italic'>"{story.quote}"</blockquote>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className='py-20 px-4 bg-[#2B2B2B] text-white'>
          <div className='container mx-auto max-w-4xl text-center'>
            <h2 className='text-3xl font-bold mb-6'>Ready to Launch Your First Event?</h2>
            <p className='text-xl mb-8 text-gray-300 max-w-2xl mx-auto'>
              Join thousands of successful creators who trust Commonly to bring their events to
              life. Start creating today and turn your passion into profit.
            </p>
            <div className='flex flex-col sm:flex-row gap-4 justify-center'>
              <Button
                size='lg'
                onClick={handleCreateEventClick}
                className='bg-white text-[#2B2B2B] hover:bg-gray-100'
              >
                Create Your Event Now <ArrowRight className='ml-2 h-4 w-4' />
              </Button>
              <Button
                size='lg'
                variant='outline'
                asChild
                className='border-white text-white hover:bg-white hover:text-[#2B2B2B]'
              >
                <Link to='/explore'>Browse Events</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ForCreators;
