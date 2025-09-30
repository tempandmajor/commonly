import { Link } from 'react-router-dom';
import SimpleHeader from '@/components/layout/SimpleHeader';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  BarChart,
  Globe,
  Target,
  Zap,
  Users,
  TrendingUp,
  Shield,
  CheckCircle,
  DollarSign,
  Star,
  MessageSquare,
  Award,
  Eye,
  MousePointer,
  Heart,
} from 'lucide-react';

const ForSponsors = () => {
  const benefits = [
    {
      icon: Target,
      title: 'Targeted Audience Reach',
      description:
        'Connect with highly engaged audiences that align perfectly with your brand values and target demographics.',
      features: [
        'Demographic targeting',
        'Interest-based matching',
        'Geographic reach',
        'Behavior analytics',
      ],
    },
    {
      icon: BarChart,
      title: 'Measurable ROI',
      description:
        'Track the performance of your sponsorships with detailed analytics and transparent reporting.',
      features: [
        'Real-time metrics',
        'Conversion tracking',
        'Brand awareness data',
        'Engagement insights',
      ],
    },
    {
      icon: Zap,
      title: 'Authentic Brand Integration',
      description:
        'Build genuine connections through natural brand integration that resonates with event audiences.',
      features: [
        'Organic brand placement',
        'Creator partnerships',
        'Community engagement',
        'Trust building',
      ],
    },
    {
      icon: Globe,
      title: 'Global Event Portfolio',
      description:
        'Access events worldwide across all categories, from intimate workshops to large conferences.',
      features: [
        'Diverse event types',
        'Multiple markets',
        'Various audience sizes',
        'Flexible budgets',
      ],
    },
    {
      icon: Shield,
      title: 'Brand Safety & Quality',
      description:
        'All events are vetted for quality and brand safety, ensuring your sponsorship investments are protected.',
      features: [
        'Content moderation',
        'Creator verification',
        'Quality standards',
        'Risk management',
      ],
    },
    {
      icon: Users,
      title: 'Community Building',
      description:
        'Foster long-term relationships with communities that matter to your brand and business goals.',
      features: [
        'Ongoing partnerships',
        'Community insights',
        'Relationship building',
        'Brand loyalty',
      ],
    },
  ];

  const sponsorshipTypes = [
    {
      title: 'Event Title Sponsorship',
      description: 'Become the presenting sponsor of high-impact events',
      price: '$500 - $10,000+',
      features: ['Logo in event title', 'Premium branding', 'Speaking opportunities', 'VIP access'],
    },
    {
      title: 'Content Sponsorship',
      description: 'Sponsor specific sessions, workshops, or content streams',
      price: '$100 - $2,500',
      features: [
        'Content integration',
        'Branded materials',
        'Audience targeting',
        'Performance tracking',
      ],
    },
    {
      title: 'Community Sponsorship',
      description: 'Long-term partnerships with creator communities',
      price: '$250 - $5,000/month',
      features: [
        'Ongoing visibility',
        'Community access',
        'Regular content',
        'Relationship building',
      ],
    },
  ];

  const successMetrics = [
    { metric: 'Average ROI', value: '340%', description: 'Return on sponsorship investment' },
    { metric: 'Brand Recall', value: '78%', description: 'Audience remembers sponsors' },
    { metric: 'Engagement Rate', value: '12.5%', description: 'Higher than industry average' },
    { metric: 'Lead Generation', value: '2.3x', description: 'Increase in qualified leads' },
  ];

  const caseStudies = [
    {
      company: 'TechFlow Solutions',
      industry: 'Software',
      challenge: 'Reach developers and tech professionals',
      solution: 'Sponsored 15 tech workshops and conferences',
      result: 'Generated 500+ qualified leads, 25% increase in developer signups',
      logo: '🚀',
    },
    {
      company: 'EcoLife Brands',
      industry: 'Sustainability',
      challenge: 'Build awareness among eco-conscious consumers',
      solution: 'Partnered with environmental and wellness events',
      result: '40% increase in brand awareness, 30% boost in sustainable product sales',
      logo: '🌱',
    },
    {
      company: 'CreativeTools Inc',
      industry: 'Design Software',
      challenge: 'Connect with creative professionals',
      solution: 'Sponsored design workshops and creative meetups',
      result: '200% increase in free trial signups, 60% improvement in brand perception',
      logo: '🎨',
    },
  ];

  const eventCategories = [
    { name: 'Technology & Innovation', count: '2,500+', icon: '💻' },
    { name: 'Business & Entrepreneurship', count: '1,800+', icon: '💼' },
    { name: 'Health & Wellness', count: '1,200+', icon: '🏃‍♂️' },
    { name: 'Arts & Culture', count: '900+', icon: '🎭' },
    { name: 'Education & Learning', count: '1,500+', icon: '📚' },
    { name: 'Community & Social', count: '800+', icon: '🤝' },
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
                Sponsor Events That
                <span className='block'>Drive Real Results</span>
              </h1>
              <p className='text-xl text-gray-600 mb-8 max-w-3xl mx-auto'>
                Connect with engaged audiences through authentic event sponsorships. Build brand
                awareness, generate leads, and create meaningful connections with communities that
                matter.
              </p>
              <div className='flex flex-col sm:flex-row gap-4 justify-center mb-12'>
                <Button size='lg' asChild className='bg-[#2B2B2B] hover:bg-gray-800 text-white'>
                  <Link to='/explore'>
                    Discover Events to Sponsor <ArrowRight className='ml-2 h-4 w-4' />
                  </Link>
                </Button>
                <Button
                  variant='outline'
                  size='lg'
                  asChild
                  className='border-gray-300 text-[#2B2B2B] hover:bg-gray-50'
                >
                  <Link to='/contact'>Contact Sales Team</Link>
                </Button>
              </div>

              {/* Success Metrics */}
              <div className='grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto'>
                {successMetrics.map((item, index) => (
                  <div key={index} className='text-center'>
                    <div className='text-3xl font-bold text-[#2B2B2B]'>{item.value}</div>
                    <div className='text-sm font-medium text-gray-800'>{item.metric}</div>
                    <div className='text-xs text-gray-600'>{item.description}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Event Categories */}
        <section className='py-16 px-4 bg-gray-50'>
          <div className='container mx-auto max-w-6xl'>
            <h2 className='text-3xl font-bold text-center mb-12 text-[#2B2B2B]'>
              Sponsor Events Across All Categories
            </h2>
            <div className='grid grid-cols-2 md:grid-cols-3 gap-6'>
              {eventCategories.map((category, index) => (
                <Card
                  key={index}
                  className='text-center hover:shadow-md transition-shadow bg-white border border-gray-200'
                >
                  <CardContent className='p-6'>
                    <div className='text-4xl mb-3'>{category.icon}</div>
                    <h3 className='font-semibold text-[#2B2B2B] mb-1'>{category.name}</h3>
                    <p className='text-sm text-gray-600'>{category.count} events</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className='py-20 px-4 bg-white'>
          <div className='container mx-auto max-w-6xl'>
            <div className='text-center mb-16'>
              <h2 className='text-3xl font-bold mb-4 text-[#2B2B2B]'>
                Why Brands Choose Commonly for Sponsorships
              </h2>
              <p className='text-xl text-gray-600 max-w-3xl mx-auto'>
                Our platform connects brands with authentic audiences through meaningful event
                experiences that drive real business results.
              </p>
            </div>

            <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-8'>
              {benefits.map((benefit, index) => (
                <Card
                  key={index}
                  className='bg-white border border-gray-200 hover:shadow-md transition-shadow'
                >
                  <CardHeader>
                    <div className='flex items-center gap-3 mb-2'>
                      <div className='p-2 bg-gray-100 rounded-lg'>
                        <benefit.icon className='h-6 w-6 text-[#2B2B2B]' />
                      </div>
                      <CardTitle className='text-lg text-[#2B2B2B]'>{benefit.title}</CardTitle>
                    </div>
                    <CardDescription className='text-gray-600'>
                      {benefit.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className='space-y-2'>
                      {benefit.features.map((feature, idx) => (
                        <li key={idx} className='flex items-center gap-2 text-sm'>
                          <CheckCircle className='h-4 w-4 text-green-600 flex-shrink-0' />
                          <span className='text-gray-700'>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Sponsorship Types */}
        <section className='py-20 px-4 bg-gray-50'>
          <div className='container mx-auto max-w-6xl'>
            <div className='text-center mb-16'>
              <h2 className='text-3xl font-bold mb-4 text-[#2B2B2B]'>
                Flexible Sponsorship Options
              </h2>
              <p className='text-xl text-gray-600'>
                Choose the sponsorship type that best fits your budget and marketing goals
              </p>
            </div>

            <div className='grid md:grid-cols-3 gap-8'>
              {sponsorshipTypes.map((type, index) => (
                <Card
                  key={index}
                  className='bg-white border border-gray-200 hover:shadow-md transition-shadow'
                >
                  <CardHeader>
                    <CardTitle className='text-xl text-[#2B2B2B]'>{type.title}</CardTitle>
                    <CardDescription className='text-gray-600'>{type.description}</CardDescription>
                    <div className='text-2xl font-bold text-[#2B2B2B] mt-2'>{type.price}</div>
                  </CardHeader>
                  <CardContent>
                    <ul className='space-y-2'>
                      {type.features.map((feature, idx) => (
                        <li key={idx} className='flex items-center gap-2 text-sm'>
                          <CheckCircle className='h-4 w-4 text-green-600 flex-shrink-0' />
                          <span className='text-gray-700'>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button className='w-full mt-6 bg-[#2B2B2B] hover:bg-gray-800 text-white'>
                      Learn More
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Case Studies */}
        <section className='py-20 px-4 bg-white'>
          <div className='container mx-auto max-w-6xl'>
            <div className='text-center mb-16'>
              <h2 className='text-3xl font-bold mb-4 text-[#2B2B2B]'>Success Stories</h2>
              <p className='text-xl text-gray-600'>
                See how brands are achieving their marketing goals through event sponsorships
              </p>
            </div>

            <div className='grid md:grid-cols-3 gap-8'>
              {caseStudies.map((study, index) => (
                <Card
                  key={index}
                  className='bg-white border border-gray-200 hover:shadow-md transition-shadow'
                >
                  <CardHeader>
                    <div className='flex items-center gap-3 mb-3'>
                      <div className='text-3xl'>{study.logo}</div>
                      <div>
                        <CardTitle className='text-lg text-[#2B2B2B]'>{study.company}</CardTitle>
                        <Badge variant='secondary' className='bg-gray-100 text-gray-700'>
                          {study.industry}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    <div>
                      <h4 className='font-semibold text-[#2B2B2B] mb-1'>Challenge:</h4>
                      <p className='text-sm text-gray-600'>{study.challenge}</p>
                    </div>
                    <div>
                      <h4 className='font-semibold text-[#2B2B2B] mb-1'>Solution:</h4>
                      <p className='text-sm text-gray-600'>{study.solution}</p>
                    </div>
                    <div>
                      <h4 className='font-semibold text-[#2B2B2B] mb-1'>Result:</h4>
                      <p className='text-sm font-medium text-green-700'>{study.result}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className='py-20 px-4 bg-gray-50'>
          <div className='container mx-auto max-w-6xl'>
            <div className='text-center mb-16'>
              <h2 className='text-3xl font-bold mb-4 text-[#2B2B2B]'>
                How Event Sponsorship Works
              </h2>
              <p className='text-xl text-gray-600'>
                Simple, transparent process from discovery to results tracking
              </p>
            </div>

            <div className='grid md:grid-cols-4 gap-8'>
              <div className='text-center'>
                <div className='w-16 h-16 bg-[#2B2B2B] text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4'>
                  1
                </div>
                <h3 className='font-semibold text-[#2B2B2B] mb-2'>Discover Events</h3>
                <p className='text-gray-600 text-sm'>
                  Browse events by category, audience, location, and budget to find perfect
                  sponsorship opportunities.
                </p>
              </div>
              <div className='text-center'>
                <div className='w-16 h-16 bg-[#2B2B2B] text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4'>
                  2
                </div>
                <h3 className='font-semibold text-[#2B2B2B] mb-2'>Connect & Negotiate</h3>
                <p className='text-gray-600 text-sm'>
                  Connect directly with event creators to discuss sponsorship packages and customize
                  your partnership.
                </p>
              </div>
              <div className='text-center'>
                <div className='w-16 h-16 bg-[#2B2B2B] text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4'>
                  3
                </div>
                <h3 className='font-semibold text-[#2B2B2B] mb-2'>Activate Sponsorship</h3>
                <p className='text-gray-600 text-sm'>
                  Launch your sponsorship with integrated branding, content, and engagement
                  opportunities.
                </p>
              </div>
              <div className='text-center'>
                <div className='w-16 h-16 bg-[#2B2B2B] text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4'>
                  4
                </div>
                <h3 className='font-semibold text-[#2B2B2B] mb-2'>Track Results</h3>
                <p className='text-gray-600 text-sm'>
                  Monitor performance with detailed analytics and reporting to measure ROI and
                  optimize future campaigns.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className='py-20 px-4 bg-[#2B2B2B] text-white'>
          <div className='container mx-auto max-w-4xl text-center'>
            <h2 className='text-3xl font-bold mb-6'>Ready to Sponsor Your First Event?</h2>
            <p className='text-xl mb-8 text-gray-300 max-w-2xl mx-auto'>
              Join leading brands who are building meaningful connections and driving results
              through authentic event sponsorships on Commonly.
            </p>
            <div className='flex flex-col sm:flex-row gap-4 justify-center'>
              <Button size='lg' asChild className='bg-white text-[#2B2B2B] hover:bg-gray-100'>
                <Link to='/explore'>
                  Find Events to Sponsor <ArrowRight className='ml-2 h-4 w-4' />
                </Link>
              </Button>
              <Button
                size='lg'
                variant='outline'
                asChild
                className='border-white text-white hover:bg-white hover:text-[#2B2B2B]'
              >
                <Link to='/contact'>Contact Our Team</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ForSponsors;
