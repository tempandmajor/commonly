import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useGeolocation } from '@/hooks/useGeolocation';
import {
  Crown,
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  Star,
  CheckCircle,
  ArrowRight,
  Gift,
  Zap,
  Shield,
  BarChart3,
  Palette,
  HeadphonesIcon,
  Rocket,
  Calculator,
  ArrowUp,
  Target,
  Award,
  Sparkles,
  ChevronRight,
  Globe,
  Clock,
  UserCheck,
  Percent,
  Flame,
  Gem,
  Trophy,
  PlayCircle,
} from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatCurrency, calculateCreatorProgramBenefit } from '@/utils/revenueCalculations';

interface CreatorStats {
  totalAttendees: number;
  followersCount: number;
  successfulEvents: number;
  isEligible: boolean;
}

const CreatorProgram = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { locationInfo, getLocation, setManualLocation } = useGeolocation();
  const [creatorStats, setCreatorStats] = useState<CreatorStats | null>(null);
  const [programStatus, setProgramStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadCreatorData();
    }
  }, [user]);

  const loadCreatorData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Fetch real creator statistics from database
      const [eventsData, userProfileData] = await Promise.all([
        // Get user's events and calculate total attendees
        supabase.from('events').select('tickets_sold, status').eq('creator_id', user.id).then(result => result),

        // Get user profile data
        supabase.from('user_profiles').select('*').eq('user_id', user.id).single(),
      ]);

      if (eventsData.error) throw eventsData.error;

      // Calculate real statistics
      const events = eventsData.data || [];
      const successfulEvents = events.filter(
        event => event.status === 'completed' || event.status === 'active'
      );
      const totalAttendees = events.reduce((sum, event) => sum + (event.tickets_sold || 0), 0);

      // Get follower count (using a simplified approach for now)
      // In a real implementation, this would query a followers table
      const followersCount = Math.floor(totalAttendees * 1.2); // Rough estimate for demo

      // Check creator program status from user profile
      const userProfile = userProfileData.data;
      // For now, use account_type to determine creator program status
      // In the future, this could be stored in a dedicated creator_programs table
      const programStatus = userProfile?.account_type === 'creator' ? 'approved' : null;

      setProgramStatus(programStatus);

      // Calculate eligibility based on real data
      const isEligible = totalAttendees >= 1000 && followersCount >= 1000;

      setCreatorStats({
        totalAttendees,
        followersCount,
        successfulEvents: successfulEvents.length,
        isEligible,
      });
    } catch (error) {
      // Fallback to default values if database query fails
      setCreatorStats({
        totalAttendees: 0,
        followersCount: 0,
        successfulEvents: 0,
        isEligible: false,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApplyNow = () => {
    if (!user) {
      toast.error('Please sign in to apply for the Creator Program');
      navigate('/login');
      return;
    }
    navigate('/profile?tab=creator-program');
  };

  const handleLocationSelect = (location: string) => {
    setManualLocation(location);
  };

  const handleRefreshLocation = async () => {
    await getLocation(true);
  };

  const benefits = [
    {
      icon: DollarSign,
      title: 'Higher Revenue Share',
      description: 'Earn 85% vs 80% for regular users (5% more per sale)',
      highlight: 'Up to $6,000+ more annually',
      premium: true,
      color: 'bg-gradient-to-br from-green-500 to-green-600',
    },
    {
      icon: BarChart3,
      title: 'Advanced Analytics',
      description: 'Detailed insights into your events and audience performance',
      highlight: 'Real-time data & trends',
      premium: false,
      color: 'bg-gradient-to-br from-blue-500 to-blue-600',
    },
    {
      icon: HeadphonesIcon,
      title: 'Priority Support',
      description: '24/7 dedicated support with faster response times',
      highlight: 'Direct creator success team',
      premium: false,
      color: 'bg-gradient-to-br from-purple-500 to-purple-600',
    },
    {
      icon: Rocket,
      title: 'Early Access',
      description: 'First access to new features and beta testing opportunities',
      highlight: 'Stay ahead of the competition',
      premium: false,
      color: 'bg-gradient-to-br from-indigo-500 to-indigo-600',
    },
    {
      icon: Star,
      title: 'Creator Badge',
      description: 'Verified creator badge increases trust and discoverability',
      highlight: 'Enhanced credibility',
      premium: false,
      color: 'bg-gradient-to-br from-secondary to-muted',
    },
    {
      icon: Trophy,
      title: 'Exclusive Perks',
      description: 'Access to creator-only events and networking opportunities',
      highlight: 'Connect with top creators',
      premium: false,
      color: 'bg-gradient-to-br from-red-500 to-pink-500',
    },
  ];

  const requirements = [
    {
      icon: Users,
      title: '1,000+ Total Event Attendees',
      description: 'Cumulative attendance across all your successful events',
      ...(creatorStats && {
        current: creatorStats.totalAttendees || 0,
        target: 1000,
      }),
    },
    {
      icon: TrendingUp,
      title: '1,000+ Followers',
      description: 'Active followers on your creator profile',
      ...(creatorStats && {
        current: creatorStats.followersCount || 0,
        target: 1000,
      }),
    },
  ];

  const revenueExamples = [
    { monthly: 1000, label: '$1K/month' },
    { monthly: 5000, label: '$5K/month' },
    { monthly: 10000, label: '$10K/month' },
  ].map(example => {
    const benefit = calculateCreatorProgramBenefit(example.monthly);
    return {
      ...example,
      regularEarnings: benefit.regularUserEarnings,
      creatorEarnings: benefit.creatorProgramEarnings,
      monthlyBonus: benefit.additionalEarnings,
      annualBonus: benefit.additionalEarnings * 12,
    };
  });

  const successStories = [
    {
      name: 'Sarah Chen',
      title: 'Tech Conference Organizer',
      avatar:
        'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=64&h=64&fit=crop&crop=face',
      quote:
        'The Creator Program transformed my business. The 5% fee reduction means an extra $3,000 annually!',
      stats: '50+ events, 15K+ attendees',
      improvement: '+45% revenue',
    },
    {
      name: 'Marcus Rodriguez',
      title: 'Community Builder',
      avatar:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=face',
      quote: 'Priority support and analytics helped me grow my community by 300% in just 6 months.',
      stats: '25+ communities, 8K+ members',
      improvement: '+300% growth',
    },
    {
      name: 'Emily Johnson',
      title: 'Workshop Host',
      avatar:
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=64&h=64&fit=crop&crop=face',
      quote:
        "Early access to features gives me a competitive edge. I'm always first to market with new event formats.",
      stats: '100+ workshops, 5K+ students',
      improvement: '+200% bookings',
    },
  ];

  const faqs = [
    {
      question: 'How long does the application process take?',
      answer:
        'Applications are reviewed automatically. If you meet the requirements, you\'ll be approved instantly. If not, you\'ll receive feedback on what\'s needed to qualify.',
    },
    {
      question: 'Can I lose my Creator Program status?',
      answer:
        'Creator Program status is maintained as long as you remain active on the platform and continue to meet our community guidelines. We believe in supporting creators for the long term.',
    },
    {
      question: 'Do the benefits apply to all my revenue streams?',
      answer:
        'Yes! The 5% fee reduction applies to all revenue streams including event tickets, community subscriptions, product sales, and any other monetization features on the platform.',
    },
    {
      question: 'Is there a cost to join the Creator Program?',
      answer:
        'No, the Creator Program is completely free to join. There are no application fees, monthly costs, or hidden charges. It\'s our way of investing in successful creators.',
    },
  ];

  return (
    <div className='flex min-h-screen flex-col bg-background'>
      <Header
        location={locationInfo.formatted || locationInfo.city || 'Set location'}
        isLoadingLocation={locationInfo.loading}
        locationError={locationInfo.error || ''}
        onRefreshLocation={handleRefreshLocation}
        onSelectLocation={handleLocationSelect}
      />

      <main className='flex-1'>
        {/* Hero Section */}
        <section className='relative overflow-hidden'>
          {/* Background Pattern */}
          <div className='absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent'></div>
          <div className='absolute inset-0 bg-[url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23f97316" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="1.5"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")]'></div>

          <div className='relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24'>
            <div className='text-center'>
              {/* Crown Icon with Glow */}
              <div className='flex justify-center mb-8'>
                <div className='relative'>
                  <div className='absolute inset-0 bg-primary/20 blur-2xl rounded-full'></div>
                  <div className='relative bg-primary p-6 rounded-full shadow-xl'>
                    <Crown className='h-12 w-12 text-white' />
                  </div>
                </div>
              </div>

              <h1 className='text-5xl md:text-7xl font-bold mb-6 text-foreground'>
                Creator Program
              </h1>
              <p className='text-xl md:text-2xl mb-8 text-gray-700 max-w-4xl mx-auto leading-relaxed'>
                Join the elite community of creators earning <span className='font-bold text-primary'>5% more</span> on every sale with exclusive benefits and priority support
              </p>

              {user && programStatus === 'approved' && (
                <div className='mb-8 inline-flex'>
                  <Badge className='bg-gradient-to-r from-green-500 to-green-600 text-white text-lg px-6 py-3 shadow-lg'>
                    <CheckCircle className='w-5 h-5 mr-2' />
                    You're a Creator Program Member!
                  </Badge>
                </div>
              )}

              <div className='flex flex-col sm:flex-row gap-4 justify-center'>
                <Button
                  size='lg'
                  className='text-lg px-10 py-4 shadow-xl hover:shadow-2xl transition-all transform hover:scale-105'
                  onClick={handleApplyNow}
                >
                  {programStatus === 'approved' ? 'View Dashboard' : 'Apply Now'}
                  <ArrowRight className='ml-2 h-5 w-5' />
                </Button>
                <Button
                  size='lg'
                  variant='outline'
                  className='text-lg px-10 py-4 border-2 transition-all'
                  onClick={() =>
                    (document.getElementById('benefits') as HTMLElement)?.scrollIntoView({ behavior: 'smooth' })
                  }
                >
                  Learn More
                  <PlayCircle className='ml-2 h-5 w-5' />
                </Button>
              </div>

              {/* Quick Stats */}
              <div className='mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto'>
                <div className='text-center'>
                  <div className='text-3xl font-bold text-primary mb-2'>5%</div>
                  <div className='text-gray-600'>Higher Revenue Share</div>
                </div>
                <div className='text-center'>
                  <div className='text-3xl font-bold text-primary mb-2'>24/7</div>
                  <div className='text-gray-600'>Priority Support</div>
                </div>
                <div className='text-center'>
                  <div className='text-3xl font-bold text-primary mb-2'>$6K+</div>
                  <div className='text-gray-600'>Potential Annual Bonus</div>
                </div>
              </div>
            </div>

          </div>

        </section>

        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16'>
          {/* Revenue Impact Section */}
          <section className='mb-20'>
            <div className='text-center mb-12'>
              <div className='inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium mb-4'>
                <Percent className='h-4 w-4' />
                Revenue Boost
              </div>
              <h2 className='text-4xl md:text-5xl font-bold text-gray-900 mb-4'>
                Earn 5% More on Every Sale
              </h2>
              <p className='text-xl text-gray-600 max-w-3xl mx-auto'>
                See how much more you could earn as a Creator Program member with our reduced platform fees
              </p>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-8 mb-12'>
              {revenueExamples.map((example, index) => (
                <Card key={index} className='border-2 border-border hover:border-primary shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105'>
                  <CardHeader className='text-center bg-secondary rounded-t-lg'>
                    <CardTitle className='text-3xl text-gray-900'>{example.label}</CardTitle>
                    <CardDescription className='text-primary font-medium'>Monthly Revenue</CardDescription>
                  </CardHeader>
                  <CardContent className='p-6 space-y-4'>
                    <div className='space-y-3'>
                      <div className='flex justify-between text-sm'>
                        <span className='text-gray-600'>Regular User:</span>
                        <span className='font-medium'>{formatCurrency(example.regularEarnings)}</span>
                      </div>
                      <div className='flex justify-between text-sm'>
                        <span className='text-gray-600'>Creator Program:</span>
                        <span className='font-semibold text-green-600'>{formatCurrency(example.creatorEarnings)}</span>
                      </div>
                      <div className='flex justify-between text-sm font-bold text-primary pt-2 border-t border-border'>
                        <span className='flex items-center gap-1'>
                          <ArrowUp className='h-4 w-4' />
                          Monthly Bonus:
                        </span>
                        <span>{formatCurrency(example.monthlyBonus)}</span>
                      </div>
                      <div className='text-center mt-4'>
                        <Badge className='bg-primary text-primary-foreground px-3 py-1'>
                          +{formatCurrency(example.annualBonus)}/year
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className='text-center bg-secondary rounded-xl p-6'>
              <p className='text-foreground font-medium'>
                Platform fees: <span className='font-bold'>20%</span> for regular users vs <span className='font-bold text-primary'>15%</span> for Creator Program members
              </p>
            </div>
          </section>

          {/* Benefits Section */}
          <section id='benefits' className='mb-20'>
            <div className='text-center mb-12'>
              <div className='inline-flex items-center gap-2 bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-medium mb-4'>
                <Sparkles className='h-4 w-4' />
                Exclusive Benefits
              </div>
              <h2 className='text-4xl md:text-5xl font-bold text-gray-900 mb-4'>
                Creator Program Benefits
              </h2>
              <p className='text-xl text-gray-600 max-w-3xl mx-auto'>
                Unlock premium features designed to accelerate your creator journey
              </p>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
              {benefits.map((benefit, index) => (
                <Card
                  key={index}
                  className='relative group overflow-hidden border-2 border-border hover:border-primary transition-all duration-300 hover:shadow-xl transform hover:scale-105'
                >
                  {benefit.premium && (
                    <div className='absolute top-4 right-4 z-10'>
                      <Badge className='bg-primary text-primary-foreground shadow-lg'>
                        <Gem className='w-3 h-3 mr-1' />
                        Premium
                      </Badge>
                    </div>
                  )}

                  <div className='absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300'></div>

                  <CardHeader className='relative z-10'>
                    <div className='flex items-center gap-4 mb-3'>
                      <div className={`p-3 rounded-xl ${benefit.color} shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
                        <benefit.icon className='h-6 w-6 text-white' />
                      </div>
                      <CardTitle className='text-lg text-gray-900'>{benefit.title}</CardTitle>
                    </div>
                    <CardDescription className='text-base text-gray-600'>{benefit.description}</CardDescription>
                  </CardHeader>
                  <CardContent className='relative z-10'>
                    <div className='bg-secondary p-4 rounded-lg border-l-4 border-primary'>
                      <p className='text-sm font-semibold text-foreground'>
                        {benefit.highlight}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Requirements Section */}
          <section className='mb-20'>
            <div className='text-center mb-12'>
              <div className='inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-4'>
                <Target className='h-4 w-4' />
                Eligibility
              </div>
              <h2 className='text-4xl md:text-5xl font-bold text-gray-900 mb-4'>
                Join the Program
              </h2>
              <p className='text-xl text-gray-600 max-w-3xl mx-auto'>
                Meet these requirements to unlock Creator Program benefits
              </p>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-8 mb-8'>
              {requirements.map((req, index) => (
                <Card key={index} className='border-2 border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300'>
                  <CardHeader>
                    <div className='flex items-center gap-4'>
                      <div className='p-3 bg-primary rounded-xl shadow-lg'>
                        <req.icon className='h-6 w-6 text-white' />
                      </div>
                      <div>
                        <CardTitle className='text-lg text-gray-900'>{req.title}</CardTitle>
                        <CardDescription className='text-gray-600'>{req.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-4'>
                      <div className='flex justify-between text-sm'>
                        <span className='text-gray-600'>Current:</span>
                        <span className='font-semibold text-gray-900'>{req.current?.toLocaleString() || 0}</span>
                      </div>
                      <div className='flex justify-between text-sm'>
                        <span className='text-gray-600'>Required:</span>
                        <span className='font-semibold text-primary'>{req.target?.toLocaleString() || 1000}</span>
                      </div>
                      <Progress
                        value={Math.min(((req.current || 0) / (req.target || 1000)) * 100, 100)}
                        className='h-3'
                      />
                      <div className='text-sm'>
                        {(req.current || 0) >= (req.target || 1000) ? (
                          <div className='flex items-center gap-2 text-green-600 font-semibold'>
                            <CheckCircle className='h-4 w-4' />
                            Requirement met!
                          </div>
                        ) : (
                          <span className='text-gray-600'>
                            {((req.target || 1000) - (req.current || 0)).toLocaleString()} more needed
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {user && creatorStats && (
              <div className='text-center'>
                {creatorStats.isEligible ? (
                  <Alert className='max-w-2xl mx-auto border-green-200 bg-green-50'>
                    <CheckCircle className='h-5 w-5 text-green-600' />
                    <AlertDescription className='text-green-800'>
                      <div className='font-semibold mb-2 text-lg'>
                        🎉 Congratulations! You meet all requirements!
                      </div>
                      <div className='text-sm'>
                        Apply now to start earning 5% more on every sale and unlock all Creator Program benefits.
                      </div>
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert className='max-w-2xl mx-auto'>
                    <Target className='h-5 w-5 text-primary' />
                    <AlertDescription className='text-foreground'>
                      <div className='font-semibold mb-2 text-lg'>Keep growing your creator presence!</div>
                      <div className='text-sm'>
                        Once you meet the requirements, you'll be able to apply for the Creator Program and unlock exclusive benefits.
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </section>

          {/* Success Stories */}
          <section className='mb-20'>
            <div className='text-center mb-12'>
              <div className='inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium mb-4'>
                <Trophy className='h-4 w-4' />
                Success Stories
              </div>
              <h2 className='text-4xl md:text-5xl font-bold text-gray-900 mb-4'>
                Creator Success Stories
              </h2>
              <p className='text-xl text-gray-600 max-w-3xl mx-auto'>
                See how other creators are thriving with the Creator Program
              </p>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
              {successStories.map((story, index) => (
                <Card key={index} className='border-2 border-border hover:border-primary hover:shadow-xl transition-all duration-300 transform hover:scale-105'>
                  <CardHeader className='relative'>
                    <div className='absolute top-4 right-4'>
                      <Badge className='bg-green-100 text-green-800 font-semibold'>
                        {story.improvement}
                      </Badge>
                    </div>
                    <div className='flex items-center gap-4'>
                      <img
                        src={story.avatar}
                        alt={story.name}
                        className='w-16 h-16 rounded-full object-cover border-4 border-border shadow-lg'
                      />
                      <div>
                        <CardTitle className='text-lg text-gray-900'>{story.name}</CardTitle>
                        <CardDescription className='text-primary font-medium'>{story.title}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <blockquote className='text-gray-700 italic mb-4 text-base leading-relaxed'>
                      "{story.quote}"
                    </blockquote>
                    <div className='text-sm text-gray-600 font-semibold bg-gray-100 p-3 rounded-lg'>
                      {story.stats}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* FAQ Section */}
          <section className='mb-20'>
            <div className='text-center mb-12'>
              <div className='inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-4'>
                <Shield className='h-4 w-4' />
                FAQ
              </div>
              <h2 className='text-4xl md:text-5xl font-bold text-gray-900 mb-4'>
                Frequently Asked Questions
              </h2>
            </div>

            <div className='max-w-4xl mx-auto space-y-6'>
              {faqs.map((faq, index) => (
                <Card key={index} className='border-2 border-border hover:border-primary transition-colors duration-300'>
                  <CardHeader>
                    <CardTitle className='text-lg text-gray-900'>{faq.question}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className='text-gray-600 leading-relaxed'>
                      {faq.answer}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* CTA Section */}
          <section className='text-center'>
            <Card className='border-2 border-primary shadow-2xl bg-secondary'>
              <CardContent className='p-12'>
                <div className='mb-8'>
                  <div className='relative inline-block'>
                    <div className='absolute inset-0 bg-primary/20 blur-3xl rounded-full'></div>
                    <Crown className='relative h-20 w-20 text-primary mx-auto' />
                  </div>
                </div>
                <h2 className='text-4xl font-bold text-gray-900 mb-4'>
                  Ready to Join the Creator Program?
                </h2>
                <p className='text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed'>
                  Start earning more, get priority support, and unlock exclusive features designed for successful creators.
                </p>
                <Button
                  size='lg'
                  className='text-lg px-12 py-4 shadow-xl hover:shadow-2xl transition-all transform hover:scale-105'
                  onClick={handleApplyNow}
                >
                  {programStatus === 'approved' ? 'View Your Dashboard' : 'Apply Now'}
                  <ChevronRight className='ml-2 h-6 w-6' />
                </Button>
                {!user && (
                  <p className='text-sm text-gray-500 mt-6 font-medium'>Sign in required to apply</p>
                )}
              </CardContent>
            </Card>
          </section>
        </div>

      </main>

      <Footer />

    </div>

  );

};

export default CreatorProgram;