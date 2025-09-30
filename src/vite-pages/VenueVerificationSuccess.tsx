import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AppLayout } from '@/components/layout/AppLayout';
import {
  CheckCircle,
  Clock,
  Star,
  Users,
  Calendar,
  MessageSquare,
  TrendingUp,
  Share,
  Eye,
  ArrowRight,
  Gift,
  Sparkles,
  Target,
  Award,
  Zap,
} from 'lucide-react';
import { EnhancedVenue } from '@/types/venue';

interface VerificationStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  icon: React.ComponentType<any>;
}

const VenueVerificationSuccess: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const venueId = searchParams.get('venueId');
  const [venue, setVenue] = useState<EnhancedVenue | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const verificationSteps: VerificationStep[] = [
    {
      id: 'submission',
      title: 'Venue Submitted',
      description: 'Your venue listing has been successfully submitted',
      completed: true,
      icon: CheckCircle,
    },
    {
      id: 'review',
      title: 'Under Review',
      description: 'Our team is reviewing your venue details and media',
      completed: true,
      icon: Eye,
    },
    {
      id: 'verification',
      title: 'Verification Complete',
      description: 'Your venue has been verified and approved',
      completed: true,
      icon: Award,
    },
    {
      id: 'live',
      title: 'Now Live',
      description: 'Your venue is now visible to potential guests',
      completed: true,
      icon: Zap,
    },
  ];

  const nextSteps = [
    {
      title: 'Optimize Your Listing',
      description: 'Add more photos and enhance your description to attract more bookings',
      action: 'Edit Venue',
      link: `/venue/edit/${venueId}`,
      icon: Star,
      color: 'bg-yellow-500',
    },
    {
      title: 'Set Up Calendar',
      description: 'Configure your availability and booking rules',
      action: 'Manage Calendar',
      link: '/venue/calendar',
      icon: Calendar,
      color: 'bg-blue-500',
    },
    {
      title: 'Promote Your Venue',
      description: 'Share your venue link and start getting bookings',
      action: 'Share Venue',
      link: '#',
      icon: Share,
      color: 'bg-green-500',
    },
    {
      title: 'Track Performance',
      description: 'Monitor views, inquiries, and booking conversion rates',
      action: 'View Analytics',
      link: '/venue/analytics',
      icon: TrendingUp,
      color: 'bg-purple-500',
    },
  ];

  const benefits = [
    {
      title: 'Direct Bookings',
      description: 'Guests can book directly without third-party fees',
      icon: Target,
    },
    {
      title: 'Higher Earnings',
      description: 'Keep more of your revenue with our low commission',
      icon: TrendingUp,
    },
    {
      title: 'Quality Guests',
      description: 'Connect with verified guests for better experiences',
      icon: Users,
    },
    {
      title: 'Support Team',
      description: '24/7 support to help you succeed as a host',
      icon: MessageSquare,
    },
  ];

  useEffect(() => {
    if (venueId) {
      fetchVenueDetails();
    }
  }, [venueId]);

  const fetchVenueDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('venues')
        .select(`
          *,
          venue_locations(*),
          venue_pricing(*),
          venue_media(*)
        `)
        .eq('id', venueId)
        .single();

      if (error) throw error;

      if (data) {
        const enhancedVenue: EnhancedVenue = {
          id: data.id,
          name: data.name,
          description: data.description,
          venue_type: data.venue_type,
          capacity: data.capacity,
          status: data.status,
          featured: data.featured || false,
          verified: data.verified || true,
          created_at: data.created_at,
          updated_at: data.updated_at,
          location: data.venue_locations?.[0] || {},
          pricing: data.venue_pricing?.[0] || {},
          media: data.venue_media?.[0] || {},
          availability: {
            available_days: [],
            available_hours: { start: '09:00', end: '22:00' },
            blackout_dates: [],
            advance_booking_days: 30,
            instant_booking_enabled: false,
          },
          amenities: { basic: [], premium: [], accessibility: [], technology: [], catering: [] },
          policies: {
            cancellation_policy: 'moderate',
            house_rules: [],
            additional_terms: '',
            smoking_allowed: false,
            pets_allowed: false,
            children_welcome: true,
          },
          host: {
            id: data.host_id || '',
            name: 'Host Name',
            avatar_url: '',
            bio: '',
            response_rate: 100,
            response_time_hours: 1,
            joined_date: data.created_at,
            verified: true,
            total_venues: 1,
            total_bookings: 0,
          },
          reviews: [],
          analytics: {
            total_views: 0,
            total_bookings: 0,
            booking_conversion_rate: 0,
            average_rating: 0,
            total_reviews: 0,
            revenue_last_30_days: 0,
            occupancy_rate: 0,
          },
        };

        setVenue(enhancedVenue);
      }
    } catch (error) {
      console.error('Error fetching venue:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = () => {
    if (venue) {
      const url = `${window.location.origin}/venues/${venue.id}`;
      navigator.clipboard.writeText(url);
      // You could add a toast notification here
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <div className="animate-pulse space-y-6">
              <div className="h-12 bg-gray-200 rounded w-64 mx-auto"></div>
              <div className="h-6 bg-gray-200 rounded w-96 mx-auto"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-4xl font-bold text-[#2B2B2B] mb-4">
              Congratulations! Your Venue is Live
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              {venue?.name} has been successfully verified and is now available for bookings.
              Start welcoming guests and earning revenue today!
            </p>
            <div className="flex items-center justify-center gap-4">
              <Badge className="bg-green-100 text-green-800 px-4 py-2">
                <Sparkles className="h-4 w-4 mr-2" />
                Verified Venue
              </Badge>
              <Badge className="bg-blue-100 text-blue-800 px-4 py-2">
                <Zap className="h-4 w-4 mr-2" />
                Now Live
              </Badge>
            </div>
          </div>

          {/* Verification Progress */}
          <Card className="border border-gray-200 mb-8">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-[#2B2B2B] mb-6 text-center">
                Verification Complete
              </h2>
              <div className="space-y-6">
                <Progress value={100} className="h-2" />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {verificationSteps.map((step, index) => {
                    const Icon = step.icon;
                    return (
                      <div key={step.id} className="text-center">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
                          <Icon className="h-6 w-6 text-green-600" />
                        </div>
                        <h3 className="font-semibold text-[#2B2B2B] mb-1">{step.title}</h3>
                        <p className="text-sm text-gray-600">{step.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Venue Preview */}
          {venue && (
            <Card className="border border-gray-200 mb-8">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold text-[#2B2B2B] mb-6">Your Live Venue</h2>
                <div className="flex gap-6">
                  <div className="w-48 h-32 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                    {venue.media.cover_image ? (
                      <img
                        src={venue.media.cover_image}
                        alt={venue.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-gray-400">No image</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-[#2B2B2B] mb-2">{venue.name}</h3>
                        <p className="text-gray-600 mb-2">{venue.venue_type} • {venue.capacity} guests</p>
                        <p className="text-gray-500">{venue.location.city}, {venue.location.state}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-[#2B2B2B]">
                          ${venue.pricing.base_price_per_hour}/hr
                        </p>
                        <p className="text-sm text-gray-600">Starting rate</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Link to={`/venues/${venue.id}`}>
                        <Button variant="outline">
                          <Eye className="h-4 w-4 mr-2" />
                          View Listing
                        </Button>
                      </Link>
                      <Button variant="outline" onClick={handleShare}>
                        <Share className="h-4 w-4 mr-2" />
                        Share
                      </Button>
                      <Link to="/venue/management">
                        <Button className="bg-[#2B2B2B] hover:bg-gray-800 text-white">
                          Manage Venue
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Next Steps */}
          <Card className="border border-gray-200 mb-8">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-[#2B2B2B] mb-6">Recommended Next Steps</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {nextSteps.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <div key={index} className="border border-gray-100 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-lg ${step.color}`}>
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-[#2B2B2B] mb-2">{step.title}</h3>
                          <p className="text-gray-600 text-sm mb-4">{step.description}</p>
                          <Link to={step.link}>
                            <Button variant="outline" size="sm">
                              {step.action}
                              <ArrowRight className="h-3 w-3 ml-2" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Benefits Section */}
          <Card className="border border-gray-200 mb-8">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-[#2B2B2B] mb-6 text-center">
                What You Get as a Host
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {benefits.map((benefit, index) => {
                  const Icon = benefit.icon;
                  return (
                    <div key={index} className="text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-[#2B2B2B] rounded-lg mb-4">
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="font-semibold text-[#2B2B2B] mb-2">{benefit.title}</h3>
                      <p className="text-sm text-gray-600">{benefit.description}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Special Offer */}
          <Card className="border border-[#2B2B2B] bg-gradient-to-r from-[#2B2B2B] to-gray-700">
            <CardContent className="p-8 text-center text-white">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white bg-opacity-20 rounded-full mb-6">
                <Gift className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-bold mb-4">Welcome Bonus</h2>
              <p className="text-lg mb-6 opacity-90">
                As a new host, enjoy 0% commission on your first 3 bookings!
              </p>
              <p className="text-sm opacity-75 mb-6">
                Start earning more from day one. This offer expires in 30 days.
              </p>
              <div className="flex justify-center gap-4">
                <Link to="/venue/management">
                  <Button variant="outline" className="bg-white text-[#2B2B2B] hover:bg-gray-100">
                    Start Hosting
                  </Button>
                </Link>
                <Link to="/support">
                  <Button variant="outline" className="border-white text-white hover:bg-white hover:text-[#2B2B2B]">
                    Get Support
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default VenueVerificationSuccess;