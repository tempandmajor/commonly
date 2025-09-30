import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AppLayout } from '@/components/layout/AppLayout';
import CatererImageGallery from '@/components/caterers/CatererImageGallery';
import CatererBookingModal from '@/components/caterers/CatererBookingModal';
import { toast } from 'sonner';
import {
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  Globe,
  Star,
  Users,
  Clock,
  DollarSign,
  Calendar,
  ChefHat,
  Award,
  Heart,
  Share2,
  MessageSquare,
  CheckCircle,
  Shield,
  Camera,
  Utensils,
  Timer,
  TrendingUp,
  Eye,
  ThumbsUp,
  MapIcon,
} from 'lucide-react';
import { EnhancedCaterer, CatererBooking } from '@/types/caterer';

const CatererDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [caterer, setCaterer] = useState<EnhancedCaterer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showGallery, setShowGallery] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (id) {
      fetchCatererDetails();
    }
  }, [id]);

  const fetchCatererDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('caterers')
        .select(`
          *,
          caterer_locations(*),
          caterer_pricing(*),
          caterer_media(*),
          caterer_menus(*),
          caterer_reviews(*)
        `)
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      if (data) {
        const typedData = data as any;
        const enhancedCaterer: EnhancedCaterer = {
          id: typedData.id,
          name: typedData.name,
          description: typedData.description,
          business_type: typedData.business_type || 'company',
          status: typedData.status,
          featured: typedData.featured || false,
          verified: typedData.verified || false,
          created_at: typedData.created_at,
          updated_at: typedData.updated_at,
          cuisine_types: typedData.cuisine_types || [],
          service_types: typedData.service_types || [],
          dietary_accommodations: typedData.dietary_accommodations || [],
          specialties: typedData.specialties || [],
          location: typedData.caterer_locations?.[0] || {
            id: '',
            address: typedData.address || '',
            city: typedData.city || '',
            state: typedData.state || '',
            country: 'US',
            postal_code: typedData.postal_code || '',
            service_radius_km: 25,
          },
          contact: {
            business_email: typedData.business_email || '',
            business_phone: typedData.business_phone || '',
            website_url: typedData.website_url,
          },
          pricing: typedData.caterer_pricing?.[0] || {
            base_price_per_person: typedData.base_price_per_person || 25,
            minimum_order_amount: typedData.minimum_order_amount || 250,
            maximum_guest_capacity: typedData.maximum_guest_capacity || 200,
            price_range: typedData.price_range || '$$',
            service_fee_percentage: 15,
            additional_fees: [],
            deposit_percentage: 50,
          },
          capacity: {
            minimum_guests: typedData.minimum_guests || 10,
            maximum_guests: typedData.maximum_guests || 200,
            recommended_group_size: 50,
            advance_booking_days: 7,
            preparation_time_hours: 4,
          },
          media: typedData.caterer_media?.[0] || {
            cover_image: typedData.cover_image,
            gallery_images: typedData.gallery_images || [],
            menu_images: [],
            portfolio_images: [],
          },
          menus: typedData.caterer_menus || [],
          availability: {
            operating_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
            operating_hours: { start: '08:00', end: '22:00' },
            blackout_dates: [],
            holiday_availability: true,
            weekend_surcharge_percentage: 0,
            holiday_surcharge_percentage: 0,
            booking_lead_time_days: 7,
            same_day_booking_enabled: false,
            instant_booking_enabled: typedData.instant_booking || false,
          },
          policies: {
            cancellation_policy: typedData.cancellation_policy || 'moderate',
            deposit_policy: '50% deposit required',
            payment_terms: 'Net 30',
            dietary_accommodations: typedData.dietary_accommodations || [],
            allergen_policy: 'Please inform us of any allergies',
            alcohol_service: typedData.alcohol_service || false,
            setup_breakdown_included: true,
            additional_terms: '',
            liability_insurance: true,
            health_permit_number: typedData.health_permit_number,
          },
          verification: {
            business_license_verified: typedData.business_license_verified || false,
            insurance_verified: typedData.insurance_verified || false,
            health_permit_verified: typedData.health_permit_verified || false,
            identity_verified: typedData.identity_verified || false,
            background_check_completed: typedData.background_check_completed || false,
            verification_date: typedData.verification_date,
            trust_score: typedData.trust_score || 75,
          },
          owner: {
            id: typedData.owner_id || typedData.id,
            name: typedData.owner_name || 'Caterer',
            email: typedData.business_email || '',
            phone: typedData.business_phone || '',
            bio: typedData.owner_bio || '',
            avatar_url: typedData.owner_avatar,
            years_experience: typedData.years_experience || 5,
            certifications: typedData.certifications || [],
            response_rate: 95,
            response_time_hours: 2,
            joined_date: typedData.created_at,
            verified: typedData.verified || false,
            total_events: typedData.total_events || 0,
            total_revenue: 0,
          },
          reviews: typedData.caterer_reviews || [],
          analytics: {
            total_views: 0,
            total_inquiries: 0,
            total_bookings: typedData.total_events || 0,
            inquiry_conversion_rate: 0,
            booking_conversion_rate: 0,
            average_rating: typedData.average_rating || 0,
            total_reviews: typedData.caterer_reviews?.length || 0,
            revenue_last_30_days: 0,
            repeat_customer_rate: 0,
            average_order_value: 0,
            peak_booking_months: [],
          },
        };

        setCaterer(enhancedCaterer);
      }
    } catch (error) {
      console.error('Error fetching caterer details:', error);
      setError('Failed to load caterer details');
      toast.error('Failed to load caterer details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookingSuccess = (booking: CatererBooking) => {
    toast.success('Booking request submitted successfully!');
    setShowBookingModal(false);
    // Optionally redirect to booking confirmation page
  };

  const handleShare = async () => {
    if (navigator.share && caterer) {
      try {
        await navigator.share({
          title: caterer.name,
          text: caterer.description,
          url: window.location.href,
        });
      } catch (error) {
        // Fallback to clipboard
        navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard');
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
    }
  };

  const handleFavorite = () => {
    setIsFavorited(!isFavorited);
    toast.success(isFavorited ? 'Removed from favorites' : 'Added to favorites');
  };

  const openGallery = (index: number = 0) => {
    setGalleryIndex(index);
    setShowGallery(true);
  };

  const getStarRating = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating)
            ? 'fill-yellow-400 text-yellow-400'
            : i < rating
              ? 'fill-yellow-400/50 text-yellow-400'
              : 'text-gray-300'
        }`}
      />
    ));
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-64"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error || !caterer) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <ChefHat className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-[#2B2B2B] mb-2">Caterer not found</h2>
            <p className="text-gray-600 mb-6">The caterer you're looking for doesn't exist or has been removed.</p>
            <Button onClick={() => navigate('/caterers')} className="bg-[#2B2B2B] hover:bg-gray-800 text-white">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Caterers
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const allImages = [
          ...(caterer.media.cover_image ? [caterer.media.cover_image] : []),
          ...caterer.media.gallery_images,
          ...caterer.media.portfolio_images,
  ];

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Back button */}
        <Button
          variant="outline"
          onClick={() => navigate('/caterers')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Caterers
        </Button>

        {/* Header */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Main image */}
          <div className="lg:col-span-2">
            <div className="relative">
              <div className="aspect-[16/9] bg-gray-200 rounded-lg overflow-hidden">
                {caterer.media.cover_image ? (
                  <img
                    src={caterer.media.cover_image}
                    alt={caterer.name}
                    className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
                    onClick={() => openGallery(0)}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#2B2B2B] to-gray-600 flex items-center justify-center">
                    <ChefHat className="h-16 w-16 text-white/70" />
                  </div>
                )}
              </div>

              {/* Image count overlay */}
              {allImages.length > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute bottom-4 right-4 bg-white/90 hover:bg-white"
                  onClick={() => openGallery(0)}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  {allImages.length} Photos
                </Button>
              )}

              {/* Gallery thumbnails */}
              {caterer.media.gallery_images.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mt-4">
                  {caterer.media.gallery_images.slice(0, 4).map((image, index) => (
                    <div
                      key={index}
                      className="aspect-square bg-gray-200 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => openGallery(index + 1)}
                    >
                      <img
                        src={image}
                        alt={`${caterer.name} gallery ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Info card */}
          <div>
            <Card className="border border-gray-200 sticky top-8">
              <CardContent className="p-6">
                <div className="space-y-6">
                  {/* Title and badges */}
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <h1 className="text-2xl font-bold text-[#2B2B2B]">{caterer.name}</h1>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleFavorite}
                          className="h-8 w-8 p-0"
                        >
                          <Heart className={`h-4 w-4 ${isFavorited ? 'fill-red-500 text-red-500' : ''}`} />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleShare}
                          className="h-8 w-8 p-0"
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {caterer.featured && (
                        <Badge className="bg-[#2B2B2B] text-white">
                          <Award className="h-3 w-3 mr-1" />
                          Featured
                        </Badge>
                      )}
                      {caterer.verified && (
                        <Badge className="bg-green-600 text-white">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                      {caterer.availability.instant_booking_enabled && (
                        <Badge className="bg-blue-600 text-white">
                          <Clock className="h-3 w-3 mr-1" />
                          Instant Book
                        </Badge>
                      )}
                      <Badge className="bg-gray-100 text-gray-800">
                        {caterer.pricing.price_range}
                      </Badge>
                    </div>

                    {/* Rating */}
                    {caterer.analytics.average_rating > 0 && (
                      <div className="flex items-center gap-2 mb-4">
                        <div className="flex">{getStarRating(caterer.analytics.average_rating)}</div>
                        <span className="text-sm font-medium">
                          {caterer.analytics.average_rating.toFixed(1)}
                        </span>
                        <span className="text-sm text-gray-600">
                          ({caterer.analytics.total_reviews} reviews)
                        </span>
                      </div>
                    )}

                    <p className="text-gray-600">{caterer.description}</p>
                  </div>

                  {/* Key info */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">
                        {caterer.location.city}, {caterer.location.state}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">
                        {caterer.capacity.minimum_guests}-{caterer.capacity.maximum_guests} guests
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">
                        ${caterer.pricing.base_price_per_person}/person
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Timer className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">
                        {caterer.availability.booking_lead_time_days} days advance booking
                      </span>
                    </div>
                  </div>

                  {/* Contact */}
                  <div className="space-y-3">
                    {caterer.contact.business_phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <a href={`tel:${caterer.contact.business_phone}`} className="text-sm hover:text-[#2B2B2B]">
                          {caterer.contact.business_phone}
                        </a>
                      </div>
                    )}
                    {caterer.contact.business_email && (
                      <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <a href={`mailto:${caterer.contact.business_email}`} className="text-sm hover:text-[#2B2B2B]">
                          {caterer.contact.business_email}
                        </a>
                      </div>
                    )}
                    {caterer.contact.website_url && (
                      <div className="flex items-center gap-3">
                        <Globe className="h-4 w-4 text-gray-400" />
                        <a href={caterer.contact.website_url} target="_blank" rel="noopener noreferrer" className="text-sm hover:text-[#2B2B2B]">
                          Visit Website
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="space-y-3">
                    <Button
                      onClick={() => setShowBookingModal(true)}
                      className="w-full bg-[#2B2B2B] hover:bg-gray-800 text-white"
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Request Quote
                    </Button>
                    <Button variant="outline" className="w-full">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Send Message
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Content tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 max-w-2xl bg-gray-100">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-[#2B2B2B] data-[state=active]:text-white"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="menus"
              className="data-[state=active]:bg-[#2B2B2B] data-[state=active]:text-white"
            >
              Menus
            </TabsTrigger>
            <TabsTrigger
              value="reviews"
              className="data-[state=active]:bg-[#2B2B2B] data-[state=active]:text-white"
            >
              Reviews
            </TabsTrigger>
            <TabsTrigger
              value="about"
              className="data-[state=active]:bg-[#2B2B2B] data-[state=active]:text-white"
            >
              About
            </TabsTrigger>
            <TabsTrigger
              value="policies"
              className="data-[state=active]:bg-[#2B2B2B] data-[state=active]:text-white"
            >
              Policies
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Cuisine and services */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-[#2B2B2B]">
                    <Utensils className="h-5 w-5" />
                    Cuisine Types
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {caterer.cuisine_types.map(cuisine => (
                      <Badge key={cuisine} variant="outline">
                        {cuisine}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-[#2B2B2B]">
                    <ChefHat className="h-5 w-5" />
                    Service Types
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {caterer.service_types.map(service => (
                      <Badge key={service} variant="outline">
                        {service}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Specialties */}
            {caterer.specialties.length > 0 && (
              <Card className="border border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-[#2B2B2B]">
                    <Award className="h-5 w-5" />
                    Specialties
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {caterer.specialties.map(specialty => (
                      <Badge key={specialty} className="bg-[#2B2B2B] text-white">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Dietary accommodations */}
            {caterer.dietary_accommodations.length > 0 && (
              <Card className="border border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-[#2B2B2B]">
                    <Shield className="h-5 w-5" />
                    Dietary Accommodations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {caterer.dietary_accommodations.map(diet => (
                      <Badge key={diet} className="bg-green-100 text-green-800">
                        {diet}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="border border-gray-200">
                <CardContent className="p-6 text-center">
                  <div className="text-2xl font-bold text-[#2B2B2B] mb-2">
                    {caterer.analytics.total_bookings}
                  </div>
                  <div className="text-gray-600">Events Catered</div>
                </CardContent>
              </Card>
              <Card className="border border-gray-200">
                <CardContent className="p-6 text-center">
                  <div className="text-2xl font-bold text-[#2B2B2B] mb-2">
                    {caterer.owner.years_experience}
                  </div>
                  <div className="text-gray-600">Years Experience</div>
                </CardContent>
              </Card>
              <Card className="border border-gray-200">
                <CardContent className="p-6 text-center">
                  <div className="text-2xl font-bold text-[#2B2B2B] mb-2">
                    {caterer.owner.response_rate}%
                  </div>
                  <div className="text-gray-600">Response Rate</div>
                </CardContent>
              </Card>
              <Card className="border border-gray-200">
                <CardContent className="p-6 text-center">
                  <div className="text-2xl font-bold text-[#2B2B2B] mb-2">
                    {caterer.owner.response_time_hours}h
                  </div>
                  <div className="text-gray-600">Response Time</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="menus" className="space-y-6">
            {caterer.menus.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {caterer.menus.map(menu => (
                  <Card key={menu.id} className="border border-gray-200">
                    <CardHeader>
                      <CardTitle className="text-[#2B2B2B]">{menu.name}</CardTitle>
                      <p className="text-gray-600">{menu.description}</p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">${menu.price_per_person}/person</span>
                          <Badge>{menu.menu_type}</Badge>
                        </div>
                        <div className="text-sm text-gray-600">
                          Minimum {menu.minimum_guests} guests
                        </div>
                        {menu.dietary_accommodations.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {menu.dietary_accommodations.map(diet => (
                              <Badge key={diet} variant="outline" className="text-xs">
                                {diet}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Utensils className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-[#2B2B2B] mb-2">No menus available</h3>
                <p className="text-gray-600">Contact the caterer for custom menu options.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="reviews" className="space-y-6">
            {caterer.reviews.length > 0 ? (
              <div className="space-y-6">
                {caterer.reviews.map(review => (
                  <Card key={review.id} className="border border-gray-200">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <Avatar>
                          <AvatarImage src={review.user_avatar} />
                          <AvatarFallback>{review.user_name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h4 className="font-semibold text-[#2B2B2B]">{review.user_name}</h4>
                              <div className="flex items-center gap-2">
                                <div className="flex">{getStarRating(review.rating)}</div>
                                <span className="text-sm text-gray-600">
                                  {new Date(review.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <Badge variant="outline">{review.event_type}</Badge>
                          </div>
                          <p className="text-gray-700">{review.comment}</p>
                          {review.guest_count && (
                            <p className="text-sm text-gray-500 mt-2">
                              Event for {review.guest_count} guests
                            </p>
                          )}
                          {review.response && (
                            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                              <h5 className="font-medium text-[#2B2B2B] mb-2">Response from {caterer.name}</h5>
                              <p className="text-gray-700">{review.response.message}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <MessageSquare className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-[#2B2B2B] mb-2">No reviews yet</h3>
                <p className="text-gray-600">Be the first to review this caterer.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="about" className="space-y-6">
            <Card className="border border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#2B2B2B]">
                  <Users className="h-5 w-5" />
                  About {caterer.owner.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={caterer.owner.avatar_url} />
                    <AvatarFallback>{caterer.owner.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold text-[#2B2B2B] mb-2">{caterer.owner.name}</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                      <div>Joined: {new Date(caterer.owner.joined_date).getFullYear()}</div>
                      <div>Experience: {caterer.owner.years_experience} years</div>
                      <div>Response rate: {caterer.owner.response_rate}%</div>
                      <div>Response time: {caterer.owner.response_time_hours}h</div>
                    </div>
                    {caterer.owner.bio && (
                      <p className="text-gray-700">{caterer.owner.bio}</p>
                    )}
                  </div>
                </div>

                {caterer.owner.certifications.length > 0 && (
                  <div>
                    <h4 className="font-medium text-[#2B2B2B] mb-2">Certifications</h4>
                    <div className="flex flex-wrap gap-2">
                      {caterer.owner.certifications.map(cert => (
                        <Badge key={cert} className="bg-[#2B2B2B] text-white">
                          {cert}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Verification */}
            <Card className="border border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#2B2B2B]">
                  <Shield className="h-5 w-5" />
                  Verification & Trust
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className={`h-4 w-4 ${caterer.verification.identity_verified ? 'text-green-600' : 'text-gray-400'}`} />
                    <span className="text-sm">Identity Verified</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className={`h-4 w-4 ${caterer.verification.business_license_verified ? 'text-green-600' : 'text-gray-400'}`} />
                    <span className="text-sm">Business License</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className={`h-4 w-4 ${caterer.verification.insurance_verified ? 'text-green-600' : 'text-gray-400'}`} />
                    <span className="text-sm">Insurance Verified</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className={`h-4 w-4 ${caterer.verification.health_permit_verified ? 'text-green-600' : 'text-gray-400'}`} />
                    <span className="text-sm">Health Permit</span>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Trust Score</span>
                    <span className="text-sm font-bold text-[#2B2B2B]">
                      {caterer.verification.trust_score}/100
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-[#2B2B2B] h-2 rounded-full"
                      style={{ width: `${caterer.verification.trust_score}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="policies" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border border-gray-200">
                <CardHeader>
                  <CardTitle className="text-[#2B2B2B]">Cancellation Policy</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge className="mb-4 capitalize">{caterer.policies.cancellation_policy}</Badge>
                  <div className="space-y-2 text-sm text-gray-700">
                    {caterer.policies.cancellation_policy === 'flexible' && (
                      <>
                        <p>• Free cancellation up to 48 hours before event</p>
                        <p>• 50% refund for cancellations within 48 hours</p>
                        <p>• No refund for same-day cancellations</p>
                      </>
                    )}
                    {caterer.policies.cancellation_policy === 'moderate' && (
                      <>
                        <p>• Free cancellation up to 7 days before event</p>
                        <p>• 50% refund for cancellations within 7 days</p>
                        <p>• No refund for cancellations within 24 hours</p>
                      </>
                    )}
                    {caterer.policies.cancellation_policy === 'strict' && (
                      <>
                        <p>• 50% refund for cancellations up to 14 days before event</p>
                        <p>• No refund for cancellations within 14 days</p>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-gray-200">
                <CardHeader>
                  <CardTitle className="text-[#2B2B2B]">Payment Terms</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-gray-700">
                    <p>• {caterer.pricing.deposit_percentage}% deposit required to secure booking</p>
                    <p>• Remaining balance due 7 days before event</p>
                    <p>• Payment methods: Credit card, check, bank transfer</p>
                    <p>• Service fee: {caterer.pricing.service_fee_percentage}%</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-gray-200">
                <CardHeader>
                  <CardTitle className="text-[#2B2B2B]">Service Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-gray-700">
                    <p>• Setup and breakdown: {caterer.policies.setup_breakdown_included ? 'Included' : 'Additional fee'}</p>
                    <p>• Alcohol service: {caterer.policies.alcohol_service ? 'Available' : 'Not available'}</p>
                    <p>• Liability insurance: {caterer.policies.liability_insurance ? 'Covered' : 'Not covered'}</p>
                    <p>• Advance booking: {caterer.availability.booking_lead_time_days} days minimum</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-gray-200">
                <CardHeader>
                  <CardTitle className="text-[#2B2B2B]">Allergen Policy</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700">
                    {caterer.policies.allergen_policy}
                  </p>
                  {caterer.policies.dietary_accommodations.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Available Accommodations:</h4>
                      <div className="flex flex-wrap gap-1">
                        {caterer.policies.dietary_accommodations.map(diet => (
                          <Badge key={diet} variant="outline" className="text-xs">
                            {diet}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Image Gallery Modal */}
        <CatererImageGallery
          media={caterer.media}
          catererName={caterer.name}
          open={showGallery}
          onOpenChange={setShowGallery}
          initialIndex={galleryIndex}
        />

        {/* Booking Modal */}
        <CatererBookingModal
          caterer={caterer}
          open={showBookingModal}
          onOpenChange={setShowBookingModal}
          onBookingSuccess={handleBookingSuccess}
        />
      </div>
    </AppLayout>
  );
};

export default CatererDetails;