import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Calendar,
  Package,
  Users,
  Megaphone,
  Store,
  ChefHat,
  MapPin,
  Mic,
  Info,
  Lock,
  ExternalLink,
  ArrowRight,
  Sparkles,
  Clock,
  TrendingUp,
  Star,
  Award,
  Zap,
  BarChart3,
  Globe,
  CheckCircle,
  Lightbulb,
  Target,
  Rocket,
} from 'lucide-react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useAuth } from '@/providers/AuthProvider';
import { useStripeConnect } from '@/hooks/useStripeConnect';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CreatorStats {
  totalEvents: number;
  totalAttendees: number;
  successfulEvents: number;
  totalRevenue: number;
  averageRating: number;
  nextMilestone: string;
  experienceLevel: 'new' | 'beginner' | 'intermediate' | 'advanced';
}

interface CreateOption {
  title: string;
  description: string;
  longDescription: string;
  icon: React.ComponentType<{ className?: string } | undefined | undefined>;
  href: string;
  status: 'available' | 'pro' | 'coming-soon';
  requiresStripe?: boolean;
  requiresVerification?: boolean;
  popular?: boolean;
  estimatedTime: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  features: string[];
  color: string;
  category: 'primary' | 'secondary' | 'advanced';
}

interface RecentActivity {
  id: string;
  type: 'event' | 'promotion' | 'application';
  title: string;
  status: 'draft' | 'published' | 'completed' | 'pending';
  lastModified: string;
  href: string;
}

const Create: React.FC = () => {
  const navigate = useNavigate();
  const { trackEvent } = useAnalytics('/create', 'Creator Hub');
  const { user } = useAuth();
  const { hasStripeConnect, isLoading: isStripeLoading } = useStripeConnect();

  const [creatorStats, setCreatorStats] = useState<CreatorStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const loadCreatorData = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      // Fetch creator statistics
      const [eventsResult, promotionsResult, profileResult] = await Promise.all([
        supabase.from('events').select('*').eq('creator_id', user.id),
        supabase.from('promotions').select('*').eq('user_id', user.id),
        supabase.from('user_profiles').select('*').eq('user_id', user.id).single(),
      ]);

      const events = eventsResult.data || [];
      const promotions = promotionsResult.data || [];

      // Calculate stats
      const totalEvents = events.length;
      const successfulEvents = events.filter(e => e.status === 'completed').length;
      const totalAttendees = events.reduce((sum, e) => sum + (e.attendees_count || 0), 0);
      const totalRevenue = events.reduce((sum, e) => sum + (e.total_revenue || 0), 0);

      // Determine experience level
      let experienceLevel: CreatorStats['experienceLevel'] = 'new';
      if (totalEvents >= 10 && successfulEvents >= 5) experienceLevel = 'advanced';
      else if (totalEvents >= 3) experienceLevel = 'intermediate';
      else if (totalEvents > 0) experienceLevel = 'beginner';

      // Determine next milestone
      let nextMilestone = 'Create your first event';
      if (experienceLevel === 'new') nextMilestone = 'Create your first event';
      else if (experienceLevel === 'beginner') nextMilestone = 'Host 3 successful events';
      else if (experienceLevel === 'intermediate') nextMilestone = 'Join Creator Program';
      else nextMilestone = 'Become a Pro Creator';

      setCreatorStats({
        totalEvents,
        totalAttendees,
        successfulEvents,
        totalRevenue,
        averageRating: 4.5, // TODO: Calculate from reviews
        nextMilestone,
        experienceLevel,
      });

      // Check if this is a new user
      if (totalEvents === 0 && promotions.length === 0) {
        setShowOnboarding(true);
      }

      // Fetch recent activity
      const recentActivities: RecentActivity[] = [
          ...events.slice(0, 3).map(event => ({
          id: event.id,
          type: 'event' as const,
          title: event.title,
          status: event.status,
          lastModified: event.updated_at,
          href: `/events/${event.id}/edit`,
        })),
          ...promotions.slice(0, 2).map(promo => ({
          id: promo.id,
          type: 'promotion' as const,
          title: promo.title,
          status: promo.status,
          lastModified: promo.updated_at,
          href: `/promotions/${promo.id}`,
        })),
      ].sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());

      setRecentActivity(recentActivities);
    } catch (error) {
      console.error('Error loading creator data:', error);
      toast.error('Failed to load creator data');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadCreatorData();
  }, [loadCreatorData]);

  useEffect(() => {
    if (user) {
      trackEvent('create_page_view', {
        timestamp: new Date().toISOString(),
        userId: user.id,
        hasStripeConnect,
        experienceLevel: creatorStats?.experienceLevel || 'new',
      });
    }

  }, [trackEvent, user, hasStripeConnect, creatorStats.experienceLevel]);

  const createOptions: CreateOption[] = useMemo(() => [
    {
      title: 'Create Event',
      description: 'Organize workshops, conferences, or social gatherings',
      longDescription: 'Create memorable experiences with our all-or-nothing funding model. Perfect for conferences, workshops, meetups, and special occasions.',
      icon: Calendar,
      href: '/create-event',
      status: 'available',
      requiresStripe: true,
      popular: true,
      estimatedTime: '10-15 min',
      difficulty: 'beginner',
      category: 'primary',
      color: 'bg-gradient-to-br from-purple-500 to-purple-600',
      features: [
        'All-or-nothing funding',
        'Ticket management',
        'Live streaming',
        'Analytics dashboard',
      ],
    },
    {
      title: 'Launch Promotion',
      description: 'Boost your content reach with targeted campaigns',
      longDescription: 'Increase visibility and engagement with smart promotional campaigns that reach your ideal audience.',
      icon: Megaphone,
      href: '/create-promotion',
      status: 'available',
      estimatedTime: '5-10 min',
      difficulty: 'intermediate',
      category: 'primary',
      color: 'bg-gradient-to-br from-blue-500 to-blue-600',
      features: [
        'Audience targeting',
        'Budget optimization',
        'Performance tracking',
        'A/B testing',
      ],
    },
    {
      title: 'List Product',
      description: 'Sell digital or physical products in the marketplace',
      longDescription: 'Monetize your expertise by selling products directly to your audience through our integrated marketplace.',
      icon: Package,
      href: '/create-product',
      status: 'available',
      estimatedTime: '15-20 min',
      difficulty: 'intermediate',
      category: 'secondary',
      color: 'bg-gradient-to-br from-green-500 to-green-600',
      features: [
        'Digital & physical products',
        'Inventory management',
        'Payment processing',
        'Customer analytics',
      ],
    },
    {
      title: 'Creator Program',
      description: 'Join our creator program for exclusive benefits',
      longDescription: 'Access exclusive features, reduced fees, priority support, and special promotional opportunities.',
      icon: Star,
      href: '/creator-program',
      status: 'available',
      estimatedTime: '3-5 min',
      difficulty: 'beginner',
      category: 'secondary',
      color: 'bg-gradient-to-br from-amber-500 to-amber-600',
      features: [
        'Reduced platform fees',
        'Priority support',
        'Exclusive features',
        'Revenue insights',
      ],
    },
    {
      title: 'Pro Features',
      description: 'Unlock advanced tools and analytics',
      longDescription: 'Get access to advanced analytics, custom branding, priority support, and enhanced promotional tools.',
      icon: Sparkles,
      href: '/pro',
      status: 'pro',
      estimatedTime: '2 min',
      difficulty: 'advanced',
      category: 'advanced',
      color: 'bg-gradient-to-br from-indigo-500 to-indigo-600',
      features: [
        'Advanced analytics',
        'Custom branding',
        'Priority support',
        'Enhanced tools',
      ],
    },
    {
      title: 'List Venue',
      description: 'Rent out your space for events and meetings',
      longDescription: 'Transform your space into a revenue stream by listing it for events, meetings, and gatherings.',
      icon: MapPin,
      href: '/list-venue',
      status: 'available',
      requiresVerification: true,
      estimatedTime: '20-25 min',
      difficulty: 'intermediate',
      category: 'secondary',
      color: 'bg-gradient-to-br from-teal-500 to-teal-600',
      features: [
        'Space optimization',
        'Booking management',
        'Photo gallery',
        'Revenue tracking',
      ],
    },
  ], []);

  const filteredOptions = useMemo(() => {
    if (!creatorStats) return createOptions.filter(opt => opt.category === 'primary');

    const { experienceLevel } = creatorStats;

    if (experienceLevel === 'new') {
      return createOptions.filter(opt => opt.difficulty === 'beginner');
    }

    if (experienceLevel === 'beginner') {
      return createOptions.filter(opt => opt.category === 'primary' || opt.difficulty === 'beginner');
    }

    return createOptions;
  }, [createOptions, creatorStats]);

  const handleOptionClick = useCallback((option: CreateOption) => {
    if (option.requiresStripe && !hasStripeConnect) {
      toast.info('Stripe Connect setup required for this feature');
      navigate('/settings/payments');
      return;
    }

    if (option.status === 'coming-soon') {
      toast.info('This feature is coming soon!');
      return;
    }

    trackEvent('creator_action_click', {
      action: option.title,
      category: option.category,
      experienceLevel: creatorStats?.experienceLevel || 'new',
    });

    navigate(option.href);
  }, [hasStripeConnect, navigate, trackEvent, creatorStats.experienceLevel]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <Skeleton className="h-12 w-96 mx-auto" />
              <Skeleton className="h-6 w-64 mx-auto" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <Skeleton className="h-8 w-48" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-64" />
                  ))}
                </div>
              </div>
              <div className="space-y-6">
                <Skeleton className="h-48" />
                <Skeleton className="h-32" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Hero Section */}
        <div className="text-center space-y-6 mb-12">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              Creator Hub
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              {creatorStats.experienceLevel === 'new'
                ? "Welcome! Let's create your first amazing event and start your creator journey."
                : `Welcome back! Continue building your creator empire with ${creatorStats.totalEvents || 0} events created.`
              }
            </p>
          </div>

          {/* Experience Level Badge */}
          {creatorStats && (
            <div className="flex items-center justify-center gap-4">
              <Badge
                variant="secondary"
                className={cn(
                  "px-4 py-2 text-sm font-medium",
                  creatorStats.experienceLevel === 'advanced' && "bg-purple-100 text-purple-700 border-purple-200",
                  creatorStats.experienceLevel === 'intermediate' && "bg-blue-100 text-blue-700 border-blue-200",
                  creatorStats.experienceLevel === 'beginner' && "bg-green-100 text-green-700 border-green-200",
                  creatorStats.experienceLevel === 'new' && "bg-yellow-100 text-yellow-700 border-yellow-200"
                )}
              >
                {creatorStats.experienceLevel === 'new' && <Sparkles className="h-4 w-4 mr-2" />}
                {creatorStats.experienceLevel === 'beginner' && <Lightbulb className="h-4 w-4 mr-2" />}
                {creatorStats.experienceLevel === 'intermediate' && <TrendingUp className="h-4 w-4 mr-2" />}
                {creatorStats.experienceLevel === 'advanced' && <Award className="h-4 w-4 mr-2" />}
                {creatorStats.experienceLevel === 'new' ? 'New Creator' :
                 creatorStats.experienceLevel === 'beginner' ? 'Rising Creator' :
                 creatorStats.experienceLevel === 'intermediate' ? 'Experienced Creator' : 'Advanced Creator'}
              </Badge>

              {!hasStripeConnect && (
                <Alert className="max-w-md">
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    <Button
                      variant="link"
                      className="p-0 h-auto text-primary"
                      onClick={() => navigate('/settings/payments')}
                    >
                      Set up payments
                    </Button>
                    {' '}to start accepting money for events
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions - Left Column */}
          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <Rocket className="h-6 w-6 text-primary" />
                Quick Actions
              </h2>
              {creatorStats.experienceLevel === 'new' && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  Getting Started
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredOptions.map((option, index) => (
                <Card
                  key={option.title}
                  className={cn(
                    "group relative cursor-pointer transition-all duration-300 hover:shadow-xl border-2 hover:border-primary/20",
                    "animate-fade-in",
                    option.popular && "ring-2 ring-primary/20"
                  )}
                  style={{
                    animationDelay: `${index * 100}ms`
                  }}
                  onClick={() => handleOptionClick(option)}
                >
                  {option.popular && (
                    <div className="absolute -top-3 left-4">
                      <Badge className="bg-primary text-primary-foreground">
                        <Star className="h-3 w-3 mr-1" />
                        Popular
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className={cn("p-3 rounded-xl text-white", option.color)}>
                        <option.icon className="h-6 w-6" />
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {option.status === 'pro' && (
                          <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700">
                            PRO
                          </Badge>
                        )}
                        {option.status === 'coming-soon' && (
                          <Badge variant="outline" className="text-xs">
                            Soon
                          </Badge>
                        )}
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {option.estimatedTime}
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div>
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">
                        {option.title}
                      </CardTitle>
                      <CardDescription className="mt-1 leading-relaxed">
                        {option.description}
                      </CardDescription>
                    </div>

                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-1">
                        {option.features.slice(0, 2).map((feature, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                        {option.features.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{option.features.length - 2} more
                          </Badge>
                        )}
                      </div>

                      <Button
                        variant="outline"
                        className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300"
                        disabled={option.status === 'coming-soon'}
                      >
                        <span className="flex items-center justify-between w-full">
                          {option.status === 'coming-soon' ? 'Coming Soon' : 'Get Started'}
                          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Additional Options for Advanced Users */}
            {creatorStats && creatorStats.experienceLevel !== 'new' && (
              <Card className="bg-muted/30 border-dashed border-2">
                <CardContent className="p-6 text-center">
                  <div className="space-y-4">
                    <div className="flex items-center justify-center">
                      <Globe className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Explore All Creator Tools</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Access the complete suite of creator tools and advanced features
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      View All Tools
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Creator Dashboard - Right Column */}
          <div className="space-y-6">
            {/* Creator Stats */}
            {creatorStats && (
              <Card className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Your Progress
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{creatorStats.totalEvents}</div>
                      <div className="text-xs text-muted-foreground">Events Created</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{creatorStats.totalAttendees}</div>
                      <div className="text-xs text-muted-foreground">Total Attendees</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Next Milestone</span>
                      <span className="font-medium">{creatorStats.nextMilestone}</span>
                    </div>
                    <Progress
                      value={creatorStats.experienceLevel === 'new' ? 10 :
                             creatorStats.experienceLevel === 'beginner' ? 35 :
                             creatorStats.experienceLevel === 'intermediate' ? 70 : 90}
                      className="h-2"
                    />
                  </div>

                  <Button variant="outline" size="sm" className="w-full">
                    <Award className="h-4 w-4 mr-2" />
                    View Achievements
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Recent Activity */}
            {recentActivity.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {recentActivity.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors cursor-pointer"
                      onClick={() => navigate(activity.href)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          activity.status === 'published' && "bg-green-500",
                          activity.status === 'draft' && "bg-yellow-500",
                          activity.status === 'pending' && "bg-blue-500"
                        )} />
                        <div>
                          <div className="font-medium text-sm">{activity.title}</div>
                          <div className="text-xs text-muted-foreground capitalize">
                            {activity.type} • {activity.status}
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ))}
                  <Button variant="ghost" size="sm" className="w-full mt-2">
                    View All Activity
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Quick Tips */}
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-700">
                  <Lightbulb className="h-5 w-5" />
                  Creator Tip
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-blue-600 leading-relaxed">
                  {creatorStats.experienceLevel === 'new'
                    ? "Start with a small workshop or meetup to get familiar with the platform before hosting larger events."
                    : "Consider joining our Creator Program to unlock reduced fees and exclusive features."
                  }
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Create;