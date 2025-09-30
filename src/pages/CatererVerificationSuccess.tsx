import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
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
  ChefHat,
  Utensils,
  Camera,
  BookOpen,
  DollarSign,
  Shield,
  FileText,
} from 'lucide-react';
import { EnhancedCaterer } from '@/types/caterer';

interface VerificationStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  icon: React.ComponentType<any>;
}

const CatererVerificationSuccess: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const catererId = searchParams.get('catererId');
  const [caterer, setCaterer] = useState<EnhancedCaterer | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const verificationSteps: VerificationStep[] = [
    {
      id: 'submission',
      title: 'Business Submitted',
      description: 'Your catering business has been successfully submitted',
      completed: true,
      icon: CheckCircle,
    },
    {
      id: 'review',
      title: 'Under Review',
      description: 'Our team reviewed your business details, menus, and credentials',
      completed: true,
      icon: Eye,
    },
    {
      id: 'verification',
      title: 'Verification Complete',
      description: 'Your catering business has been verified and approved',
      completed: true,
      icon: Shield,
    },
    {
      id: 'live',
      title: 'Now Live',
      description: 'Your business is now visible to potential clients',
      completed: true,
      icon: Zap,
    },
  ];

  const nextSteps = [
    {
      title: 'Optimize Your Listing',
      description: 'Add more photos, menus, and enhance your description to attract more bookings',
      action: 'Edit Business',
      link: `/caterer/edit/${catererId}`,
      icon: Star,
      color: 'bg-yellow-500',
    },
    {
      title: 'Set Up Availability',
      description: 'Configure your calendar and booking preferences',
      action: 'Manage Calendar',
      link: '/caterer/calendar',
      icon: Calendar,
      color: 'bg-blue-500',
    },
    {
      title: 'Promote Your Business',
      description: 'Share your catering business link and start getting bookings',
      action: 'Share Business',
      link: '#',
      icon: Share,
      color: 'bg-green-500',
    },
    {
      title: 'Track Performance',
      description: 'Monitor views, inquiries, and booking conversion rates',
      action: 'View Analytics',
      link: '/caterer/analytics',
      icon: TrendingUp,
      color: 'bg-purple-500',
    },
  ];

  const benefits = [
    {
      title: 'Direct Bookings',
      description: 'Clients can book directly without third-party fees',
      icon: Target,
    },
    {
      title: 'Higher Earnings',
      description: 'Keep more of your revenue with our low commission',
      icon: DollarSign,
    },
    {
      title: 'Quality Clients',
      description: 'Connect with verified clients for better events',
      icon: Users,
    },
    {
      title: 'Support Team',
      description: '24/7 support to help you grow your catering business',
      icon: MessageSquare,
    },
  ];

  useEffect(() => {
    if (catererId) {
      fetchCatererDetails();
    } else {
      // Mock data for demonstration
      setIsLoading(false);
      setCaterer({
        id: 'demo-caterer-1',
        name: 'Delicious Delights Catering',
        description: 'Premium wedding and corporate catering with over 15 years of experience.',
        business_type: 'company',
        status: 'active',
        featured: true,
        verified: true,
        created_at: '2024-09-28T00:00:00Z',
        updated_at: '2024-09-28T00:00:00Z',
        location: {
          address: '123 Culinary Lane',
          city: 'San Francisco',
          state: 'CA',
          postal_code: '94102',
          country: 'US',
          service_radius_km: 50,
        },
        contact: {
          business_email: 'info@deliciousdelights.com',
          business_phone: '(415) 555-0123',
          website_url: 'https://deliciousdelights.com',
        },
        cuisine_types: ['Italian', 'Mediterranean', 'American', 'Vegetarian'],
        service_types: ['Wedding Catering', 'Corporate Events', 'Private Dinners'],
        dietary_accommodations: ['Vegetarian', 'Vegan', 'Gluten-Free'],
        pricing: {
          minimum_guests: 25,
          maximum_guests: 500,
          base_price_per_person: 45.00,
          minimum_order_amount: 1125.00,
          price_range: '$$$',
          advance_booking_days: 14,
          deposit_percentage: 30,
          cancellation_policy: 'moderate',
        },
        sample_menus: [
          {
            id: 'menu-1',
            name: 'Elegant Wedding Package',
            menu_type: 'plated',
            description: 'Three-course plated dinner with appetizer station',
            price_per_person: 65.00,
          },
        ],
        media: {
          cover_image: '/api/placeholder/800/600',
          gallery_images: ['/api/placeholder/400/300'],
          menu_images: ['/api/placeholder/400/300'],
        },
        owner: {
          id: 'owner-1',
          name: 'Maria Rodriguez',
          avatar_url: '/api/placeholder/100/100',
          bio: 'Executive Chef with 20+ years experience',
          response_rate: 98,
          response_time_hours: 2,
          joined_date: '2024-09-28T00:00:00Z',
          verified: true,
          total_caterers: 1,
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
          repeat_customer_rate: 0,
        },
      });
    }
  }, [catererId]);

  const fetchCatererDetails = async () => {
    try {
      // This would normally fetch from Supabase
      // For now, using mock data
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching caterer:', error);
      setIsLoading(false);
    }
  };

  const handleShare = () => {
    if (caterer) {
      const url = `${window.location.origin}/caterers/${caterer.id}`;
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
              Congratulations! Your Catering Business is Live
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              {caterer?.name} has been successfully verified and is now available for bookings.
              Start connecting with clients and growing your catering business today!
            </p>
            <div className="flex items-center justify-center gap-4">
              <Badge className="bg-green-100 text-green-800 px-4 py-2">
                <Shield className="h-4 w-4 mr-2" />
                Verified Business
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

          {/* Business Preview */}
          {caterer && (
            <Card className="border border-gray-200 mb-8">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold text-[#2B2B2B] mb-6">Your Live Catering Business</h2>
                <div className="flex gap-6">
                  <div className="w-48 h-32 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                    {caterer.media.cover_image ? (
                      <img
                        src={caterer.media.cover_image}
                        alt={caterer.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ChefHat className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-[#2B2B2B] mb-2">{caterer.name}</h3>
                        <p className="text-gray-600 mb-2">
                          {caterer.business_type.replace('_', ' ').charAt(0).toUpperCase() + caterer.business_type.replace('_', ' ').slice(1)} •
                          {caterer.pricing.minimum_guests}-{caterer.pricing.maximum_guests} guests
                        </p>
                        <p className="text-gray-500">{caterer.location.city}, {caterer.location.state}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {caterer.cuisine_types.slice(0, 3).map((cuisine, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {cuisine}
                            </Badge>
                          ))}
                          {caterer.cuisine_types.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{caterer.cuisine_types.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-[#2B2B2B]">
                          ${caterer.pricing.base_price_per_person}/person
                        </p>
                        <p className="text-sm text-gray-600">Starting rate</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Link to={`/caterers/${caterer.id}`}>
                        <Button variant="outline">
                          <Eye className="h-4 w-4 mr-2" />
                          View Listing
                        </Button>
                      </Link>
                      <Button variant="outline" onClick={handleShare}>
                        <Share className="h-4 w-4 mr-2" />
                        Share
                      </Button>
                      <Link to="/caterer/management">
                        <Button className="bg-[#2B2B2B] hover:bg-gray-800 text-white">
                          Manage Business
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

          {/* Success Tips */}
          <Card className="border border-gray-200 mb-8">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-[#2B2B2B] mb-6">Tips for Success</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Camera className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-[#2B2B2B] mb-1">High-Quality Photos</h4>
                      <p className="text-sm text-gray-600">Upload appetizing photos of your dishes and event setups to attract more clients.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <BookOpen className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-[#2B2B2B] mb-1">Detailed Menus</h4>
                      <p className="text-sm text-gray-600">Create comprehensive sample menus with pricing to help clients make decisions.</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-[#2B2B2B] mb-1">Quick Responses</h4>
                      <p className="text-sm text-gray-600">Respond to inquiries within 2 hours to improve your booking conversion rate.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Star className="h-4 w-4 text-yellow-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-[#2B2B2B] mb-1">Gather Reviews</h4>
                      <p className="text-sm text-gray-600">Encourage satisfied clients to leave reviews to build credibility and trust.</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Benefits Section */}
          <Card className="border border-gray-200 mb-8">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-[#2B2B2B] mb-6 text-center">
                What You Get as a Caterer
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
                As a new caterer, enjoy 0% commission on your first 3 bookings!
              </p>
              <p className="text-sm opacity-75 mb-6">
                Start earning more from day one. This offer expires in 30 days.
              </p>
              <div className="flex justify-center gap-4">
                <Link to="/caterer/management">
                  <Button variant="outline" className="bg-white text-[#2B2B2B] hover:bg-gray-100">
                    Start Catering
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

export default CatererVerificationSuccess;