import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  MapPin,
  Users,
  Clock,
  Star,
  Calendar as CalendarIcon,
  ArrowLeft,
  Heart,
  Share2,
  Phone,
  Mail,
  Globe,
  Wifi,
  Car,
  Shield,
  Camera,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Info,
  Zap,
  Award,
  MapIcon,
  Play,
  Eye,
  Maximize,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { LoadingSkeleton } from '@/components/ui/loading';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { EnhancedVenue, VenueBooking } from '@/types/venue';
import AppLayout from '@/components/layout/AppLayout';

const VenueDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  // State
  const [venue, setVenue] = useState<EnhancedVenue | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showImageGallery, setShowImageGallery] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);

  // Booking form state
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [guestCount, setGuestCount] = useState('');
  const [eventType, setEventType] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [contactPhone, setContactPhone] = useState(user?.phone || '');
  const [contactEmail, setContactEmail] = useState(user?.email || '');

  useEffect(() => {
    if (id) {
      fetchVenueDetails();
    }

    // Check if booking parameter is present
    if (searchParams.get('booking') === 'true') {
      setShowBookingModal(true);
    }
  }, [id, searchParams]);

  const fetchVenueDetails = async () => {
    try {
      setLoading(true);

      if (!id) {
        toast.error('Venue ID is required');
        navigate('/venues');
        return;
      }

      const { data: venueData, error } = await supabase
        .from('venues')
        .select(`
          *,
          location:locations(*),
          host:users!venues_owner_id_fkey(
            id,
            name,
            display_name,
            avatar_url,
            created_at
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          toast.error('Venue not found');
          navigate('/venues');
          return;
        }
        throw error;
      }

      if (!venueData) {
        toast.error('Venue not found');
        navigate('/venues');
        return;
      }

      // Transform database venue to component format
      const typedVenue = venueData as any;
      const transformedVenue: EnhancedVenue = {
        id: typedVenue.id,
        name: typedVenue.name || 'Unnamed Venue',
        description: typedVenue.description || 'Professional venue space available for events.',
        venue_type: typedVenue.venue_type || 'Event Space',
        capacity: typedVenue.capacity || 50,
        status: typedVenue.status || 'active',
        featured: typedVenue.featured || false,
        verified: typedVenue.verified || true,
        created_at: typedVenue.created_at,
        updated_at: typedVenue.updated_at,

        location: {
          id: typedVenue.location?.id || '',
          address: typedVenue.location?.address || 'Address not available',
          city: typedVenue.location?.city || 'Unknown City',
          state: typedVenue.location?.state || 'Unknown State',
          country: typedVenue.location?.country || 'Unknown Country',
          postal_code: typedVenue.location?.postal_code || '',
          latitude: typedVenue.location?.latitude,
          longitude: typedVenue.location?.longitude,
          neighborhood: typedVenue.location?.neighborhood,
        },

        pricing: {
          base_price_per_hour: typedVenue.base_price_per_hour || Math.max(75, typedVenue.capacity * 2),
          minimum_booking_hours: typedVenue.minimum_booking_hours || 2,
          maximum_booking_hours: typedVenue.maximum_booking_hours || 12,
          weekend_multiplier: 1.2,
          holiday_multiplier: 1.5,
          security_deposit: typedVenue.security_deposit || 300,
          cleaning_fee: typedVenue.cleaning_fee || 75,
          service_fee_percentage: 0.08,
        },

        media: {
          cover_image: typedVenue.cover_image || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&h=800&fit=crop',
          gallery_images: typedVenue.gallery_images || [
            'https://images.unsplash.com/photo-1519167758481-83f29c1fe8c0?w=1200&h=800&fit=crop',
            'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&h=800&fit=crop',
            'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=1200&h=800&fit=crop',
            'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1200&h=800&fit=crop',
          ],
          virtual_tour_url: 'https://example.com/virtual-tour',
        },

        amenities: {
          basic: typedVenue.amenities || [
            'Professional Sound System',
            'Stage Lighting',
            'Parking Available',
            'High-Speed WiFi',
            'Climate Control',
            'Security System',
          ],
          premium: [
            'Professional A/V Equipment',
            'Green Room',
            'Catering Kitchen',
            'Valet Parking',
          ],
          accessibility: [
            'Wheelchair Accessible',
            'Accessible Restrooms',
            'Elevator Access',
            'Hearing Loop',
          ],
          technology: [
            '4K Projectors',
            'Wireless Microphones',
            'Live Streaming Setup',
            'LED Video Wall',
          ],
          catering: [
            'Full Kitchen',
            'Bar Service',
            'Preferred Caterers',
            'Kosher Kitchen',
          ],
        },

        host: {
          id: typedVenue.host?.id || '',
          name: typedVenue.host?.display_name || typedVenue.host?.name || 'Professional Host',
          avatar_url: typedVenue.host?.avatar_url || 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
          bio: 'Experienced venue host dedicated to making your event memorable and successful.',
          response_rate: 98,
          response_time_hours: 1.5,
          joined_date: typedVenue.host?.created_at || typedVenue.created_at,
          verified: true,
          total_venues: 3,
          total_bookings: 247,
        },

        analytics: {
          total_views: 1247,
          total_bookings: 89,
          booking_conversion_rate: 0.18,
          average_rating: 4.7,
          total_reviews: 34,
          revenue_last_30_days: 15600,
          occupancy_rate: 0.75,
        },

        availability: {
          available_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
          available_hours: { start: '08:00', end: '23:00' },
          blackout_dates: [],
          advance_booking_days: 1,
          instant_booking_enabled: typedVenue.instant_booking_enabled || false,
        },

        policies: {
          cancellation_policy: 'moderate',
          house_rules: [
            'No smoking inside the venue',
            'Events must end by venue closing time',
            'Setup and breakdown time included in rental',
            'Respect noise levels after 10 PM',
            'Additional security deposit may be required for certain events',
          ],
          additional_terms: 'All events subject to venue approval. Damage deposit required.',
          smoking_allowed: false,
          pets_allowed: false,
          children_welcome: true,
        },

        reviews: [
          {
            id: '1',
            user_id: '1',
            user_name: 'Sarah Johnson',
            user_avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=50&h=50&fit=crop&crop=face',
            rating: 5,
            comment: 'Absolutely perfect venue for our corporate event. The staff was incredibly helpful and the space exceeded our expectations!',
            event_type: 'Corporate Event',
            booking_date: '2024-01-15',
            created_at: '2024-01-20',
            helpful_count: 12,
          },
          {
            id: '2',
            user_id: '2',
            user_name: 'Michael Chen',
            user_avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face',
            rating: 5,
            comment: 'Beautiful space with excellent acoustics. Our wedding reception was magical here. Highly recommend!',
            event_type: 'Wedding',
            booking_date: '2024-01-08',
            created_at: '2024-01-12',
            helpful_count: 8,
          },
          {
            id: '3',
            user_id: '3',
            user_name: 'Emily Rodriguez',
            user_avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&h=50&fit=crop&crop=face',
            rating: 4,
            comment: 'Great venue with professional setup. Only minor issue was parking, but overall fantastic experience.',
            event_type: 'Conference',
            booking_date: '2023-12-20',
            created_at: '2023-12-25',
            helpful_count: 5,
          },
        ],
      };

      setVenue(transformedVenue);
    } catch (error) {
      console.error('Error fetching venue:', error);
      toast.error('Failed to load venue details');
      navigate('/venues');
    } finally {
      setLoading(false);
    }
  };

  const handleBookingSubmit = async () => {
    if (!venue || !selectedDate || !startTime || !endTime || !guestCount || !eventType) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!user) {
      toast.error('Please log in to make a booking');
      return;
    }

    try {
      const startDateTime = new Date(selectedDate);
      const [startHour, startMinute] = startTime.split(':');
      startDateTime.setHours(parseInt(startHour), parseInt(startMinute));

      const endDateTime = new Date(selectedDate);
      const [endHour, endMinute] = endTime.split(':');
      endDateTime.setHours(parseInt(endHour), parseInt(endMinute));

      const totalHours = (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60 * 60);
      const baseCost = totalHours * venue.pricing.base_price_per_hour;
      const cleaningFee = venue.pricing.cleaning_fee;
      const serviceFee = baseCost * venue.pricing.service_fee_percentage;
      const totalAmount = baseCost + cleaningFee + serviceFee;

      const bookingData: Partial<VenueBooking> = {
        venue_id: venue.id,
        user_id: user.id,
        event_title: `${eventType} Event`,
        event_type: eventType,
        event_description: eventDescription,
        start_datetime: startDateTime.toISOString(),
        end_datetime: endDateTime.toISOString(),
        guest_count: parseInt(guestCount),
        total_hours: totalHours,
        base_cost: baseCost,
        additional_fees: cleaningFee + serviceFee,
        tax_amount: 0,
        total_amount: totalAmount,
        contact_phone: contactPhone,
        contact_email: contactEmail,
        special_requests: specialRequests,
        setup_requirements: '',
        status: venue.availability.instant_booking_enabled ? 'approved' : 'pending',
        payment_status: 'pending',
        host_response: '',
      };

      const { error } = await supabase
        .from('venue_bookings')
        .insert(bookingData);

      if (error) throw error;

      toast.success(
        venue.availability.instant_booking_enabled
          ? 'Booking confirmed! You will receive a confirmation email shortly.'
          : 'Booking request submitted! The host will respond within 24 hours.'
      );

      setShowBookingModal(false);

      // Reset form
      setSelectedDate(undefined);
      setStartTime('');
      setEndTime('');
      setGuestCount('');
      setEventType('');
      setEventDescription('');
      setSpecialRequests('');
    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error('Failed to submit booking request');
    }
  };

  const handleToggleFavorite = () => {
    setIsFavorited(!isFavorited);
    toast.success(isFavorited ? 'Removed from favorites' : 'Added to favorites');
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      toast.success('Venue link copied to clipboard');
    });
  };

  const calculateBookingTotal = () => {
    if (!venue || !selectedDate || !startTime || !endTime) return 0;

    const startDateTime = new Date(selectedDate);
    const [startHour, startMinute] = startTime.split(':');
    startDateTime.setHours(parseInt(startHour), parseInt(startMinute));

    const endDateTime = new Date(selectedDate);
    const [endHour, endMinute] = endTime.split(':');
    endDateTime.setHours(parseInt(endHour), parseInt(endMinute));

    const totalHours = (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60 * 60);
    const baseCost = totalHours * venue.pricing.base_price_per_hour;
    const cleaningFee = venue.pricing.cleaning_fee;
    const serviceFee = baseCost * venue.pricing.service_fee_percentage;

    return baseCost + cleaningFee + serviceFee;
  };

  const nextImage = () => {
    if (!venue) return;
    setCurrentImageIndex(prev =>
      prev === venue.media.gallery_images.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    if (!venue) return;
    setCurrentImageIndex(prev =>
      prev === 0 ? venue.media.gallery_images.length - 1 : prev - 1
    );
  };

  const renderStars = (rating: number) => {
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

  if (loading) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            <LoadingSkeleton skeletonType="card" className="mb-6" />
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <LoadingSkeleton skeletonType="card" />
                <LoadingSkeleton skeletonType="text" skeletonCount={3} />
                <LoadingSkeleton skeletonType="card" />
              </div>
              <div className="space-y-6">
                <LoadingSkeleton skeletonType="card" />
                <LoadingSkeleton skeletonType="card" />
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!venue) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-2xl font-bold mb-4 text-[#2B2B2B]">Venue Not Found</h1>
            <p className="text-gray-600 mb-6">
              The venue you're looking for doesn't exist or may have been removed.
            </p>
            <Button onClick={() => navigate('/venues')} className="bg-[#2B2B2B] hover:bg-gray-800 text-white">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Venues
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Back Button */}
            <Button variant="ghost" className="mb-6 text-[#2B2B2B]" onClick={() => navigate('/venues')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Venues
            </Button>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-8">
                {/* Image Gallery */}
                <div className="relative">
                  <div className="aspect-[16/10] bg-gray-100 rounded-xl overflow-hidden">
                    <img
                      src={venue.media.gallery_images[currentImageIndex]}
                      alt={venue.name}
                      className="w-full h-full object-cover"
                    />

                    {/* Image Navigation */}
                    {venue.media.gallery_images.length > 1 && (
                      <>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white"
                          onClick={prevImage}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white"
                          onClick={nextImage}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </>
                    )}

                    {/* Image Counter and Gallery Button */}
                    <div className="absolute bottom-4 right-4 flex gap-2">
                      <Badge className="bg-black/70 text-white">
                        <Camera className="h-3 w-3 mr-1" />
                        {currentImageIndex + 1} / {venue.media.gallery_images.length}
                      </Badge>
                      <Button
                        size="sm"
                        className="bg-white/90 hover:bg-white text-[#2B2B2B]"
                        onClick={() => setShowImageGallery(true)}
                      >
                        <Maximize className="h-4 w-4 mr-1" />
                        View All
                      </Button>
                    </div>

                    {/* Virtual Tour Button */}
                    {venue.media.virtual_tour_url && (
                      <div className="absolute bottom-4 left-4">
                        <Button
                          size="sm"
                          className="bg-[#2B2B2B] hover:bg-gray-800 text-white"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Virtual Tour
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Thumbnail Gallery */}
                  {venue.media.gallery_images.length > 1 && (
                    <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                      {venue.media.gallery_images.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                            index === currentImageIndex
                              ? 'border-[#2B2B2B]'
                              : 'border-transparent hover:border-gray-300'
                          }`}
                        >
                          <img
                            src={image}
                            alt={`${venue.name} ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Venue Info */}
                <div>
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-3xl font-bold text-[#2B2B2B]">{venue.name}</h1>
                        {venue.verified && (
                          <Badge className="bg-blue-100 text-blue-800">
                            <Shield className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                        {venue.featured && (
                          <Badge className="bg-[#2B2B2B] text-white">
                            <Award className="h-3 w-3 mr-1" />
                            Featured
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-gray-600 mb-4">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span>{venue.location.address}, {venue.location.city}, {venue.location.state}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-1">
                          {renderStars(venue.analytics.average_rating)}
                          <span className="font-medium ml-1">{venue.analytics.average_rating}</span>
                          <span className="text-gray-600">
                            ({venue.analytics.total_reviews} reviews)
                          </span>
                        </div>
                        <Badge variant="outline">{venue.venue_type}</Badge>
                        <div className="flex items-center gap-1 text-gray-600">
                          <Users className="h-4 w-4" />
                          <span>Up to {venue.capacity} guests</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleShare}>
                        <Share2 className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleToggleFavorite}>
                        <Heart className={`h-4 w-4 ${isFavorited ? 'fill-red-500 text-red-500' : ''}`} />
                      </Button>
                    </div>
                  </div>

                  <p className="text-gray-700 text-lg leading-relaxed">
                    {venue.description}
                  </p>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="amenities" className="w-full">
                  <TabsList className="grid w-full grid-cols-4 bg-gray-100">
                    <TabsTrigger
                      value="amenities"
                      className="data-[state=active]:bg-[#2B2B2B] data-[state=active]:text-white"
                    >
                      Amenities
                    </TabsTrigger>
                    <TabsTrigger
                      value="policies"
                      className="data-[state=active]:bg-[#2B2B2B] data-[state=active]:text-white"
                    >
                      Policies
                    </TabsTrigger>
                    <TabsTrigger
                      value="location"
                      className="data-[state=active]:bg-[#2B2B2B] data-[state=active]:text-white"
                    >
                      Location
                    </TabsTrigger>
                    <TabsTrigger
                      value="reviews"
                      className="data-[state=active]:bg-[#2B2B2B] data-[state=active]:text-white"
                    >
                      Reviews
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="amenities" className="mt-6">
                    <Card className="border border-gray-200">
                      <CardHeader>
                        <CardTitle className="text-[#2B2B2B]">What this venue offers</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div>
                          <h4 className="font-semibold text-[#2B2B2B] mb-3">Basic Amenities</h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {venue.amenities.basic.map((amenity, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <span className="text-sm">{amenity}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {venue.amenities.premium.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-[#2B2B2B] mb-3">Premium Features</h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              {venue.amenities.premium.map((amenity, index) => (
                                <div key={index} className="flex items-center gap-2">
                                  <Zap className="h-4 w-4 text-yellow-600" />
                                  <span className="text-sm">{amenity}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {venue.amenities.accessibility.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-[#2B2B2B] mb-3">Accessibility</h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              {venue.amenities.accessibility.map((amenity, index) => (
                                <div key={index} className="flex items-center gap-2">
                                  <Shield className="h-4 w-4 text-blue-600" />
                                  <span className="text-sm">{amenity}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="policies" className="mt-6">
                    <Card className="border border-gray-200">
                      <CardHeader>
                        <CardTitle className="text-[#2B2B2B]">Policies & Rules</CardTitle>
                        <CardDescription>
                          Please review these important guidelines before booking
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div>
                          <h4 className="font-semibold text-[#2B2B2B] mb-3">House Rules</h4>
                          <div className="space-y-2">
                            {venue.policies.house_rules.map((rule, index) => (
                              <div key={index} className="flex items-start gap-2">
                                <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                <span className="text-sm">{rule}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold text-[#2B2B2B] mb-3">Cancellation Policy</h4>
                          <p className="text-sm text-gray-600">
                            {venue.policies.cancellation_policy === 'flexible' &&
                              'Full refund 24 hours prior to event start time.'}
                            {venue.policies.cancellation_policy === 'moderate' &&
                              'Full refund 5 days prior to event start time, 50% refund for cancellations within 5 days.'}
                            {venue.policies.cancellation_policy === 'strict' &&
                              'Full refund 14 days prior to event start time, 50% refund for cancellations within 14 days.'}
                          </p>
                        </div>

                        {venue.policies.additional_terms && (
                          <div>
                            <h4 className="font-semibold text-[#2B2B2B] mb-3">Additional Terms</h4>
                            <p className="text-sm text-gray-600">{venue.policies.additional_terms}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="location" className="mt-6">
                    <Card className="border border-gray-200">
                      <CardHeader>
                        <CardTitle className="text-[#2B2B2B]">Location & Access</CardTitle>
                        <CardDescription>
                          {venue.location.address}, {venue.location.city}, {venue.location.state}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                          <div className="text-center">
                            <MapIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                            <p className="text-gray-600">Interactive map coming soon</p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-[#2B2B2B]" />
                            <span className="text-sm">{venue.location.address}</span>
                          </div>
                          {venue.location.neighborhood && (
                            <div className="flex items-center gap-2">
                              <Info className="h-4 w-4 text-[#2B2B2B]" />
                              <span className="text-sm">Located in {venue.location.neighborhood}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Car className="h-4 w-4 text-[#2B2B2B]" />
                            <span className="text-sm">Parking available on-site</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="reviews" className="mt-6">
                    <Card className="border border-gray-200">
                      <CardHeader>
                        <CardTitle className="text-[#2B2B2B]">Guest Reviews</CardTitle>
                        <CardDescription>
                          {venue.analytics.total_reviews} reviews • Average rating: {venue.analytics.average_rating}/5
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          {venue.reviews.map(review => (
                            <div key={review.id} className="space-y-3">
                              <div className="flex items-start gap-3">
                                <img
                                  src={review.user_avatar}
                                  alt={review.user_name}
                                  className="w-12 h-12 rounded-full"
                                />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-[#2B2B2B]">{review.user_name}</span>
                                    <Badge variant="outline" className="text-xs">
                                      {review.event_type}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-2 mb-2">
                                    {renderStars(review.rating)}
                                    <span className="text-sm text-gray-600">
                                      {new Date(review.created_at).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-700">{review.comment}</p>
                                  {review.helpful_count > 0 && (
                                    <div className="mt-2">
                                      <span className="text-xs text-gray-500">
                                        {review.helpful_count} people found this helpful
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              {review.id !== venue.reviews[venue.reviews.length - 1].id && (
                                <Separator />
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Booking Sidebar */}
              <div className="space-y-6">
                {/* Pricing Card */}
                <Card className="sticky top-6 border border-gray-200">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-2xl text-[#2B2B2B]">
                          ${venue.pricing.base_price_per_hour}/hour
                        </CardTitle>
                        <CardDescription>
                          Minimum {venue.pricing.minimum_booking_hours} hours
                        </CardDescription>
                      </div>
                      {venue.availability.instant_booking_enabled && (
                        <Badge className="bg-green-100 text-green-800">
                          <Zap className="h-3 w-3 mr-1" />
                          Instant Book
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button
                      onClick={() => setShowBookingModal(true)}
                      className="w-full bg-[#2B2B2B] hover:bg-gray-800 text-white"
                      size="lg"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {venue.availability.instant_booking_enabled ? 'Book Instantly' : 'Request to Book'}
                    </Button>

                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>Base rate ({venue.pricing.minimum_booking_hours}hrs)</span>
                        <span>${venue.pricing.base_price_per_hour * venue.pricing.minimum_booking_hours}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Cleaning fee</span>
                        <span>${venue.pricing.cleaning_fee}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Service fee</span>
                        <span>${Math.round(venue.pricing.base_price_per_hour * venue.pricing.minimum_booking_hours * venue.pricing.service_fee_percentage)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-semibold text-[#2B2B2B]">
                        <span>Total (est.)</span>
                        <span>${venue.pricing.base_price_per_hour * venue.pricing.minimum_booking_hours + venue.pricing.cleaning_fee + Math.round(venue.pricing.base_price_per_hour * venue.pricing.minimum_booking_hours * venue.pricing.service_fee_percentage)}</span>
                      </div>
                    </div>

                    <p className="text-xs text-center text-gray-500">
                      {venue.availability.instant_booking_enabled
                        ? 'Instant confirmation upon booking'
                        : 'Host typically responds within 2 hours'
                      }
                    </p>
                  </CardContent>
                </Card>

                {/* Host Info */}
                <Card className="border border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-[#2B2B2B]">Hosted by {venue.host.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3 mb-4">
                      <img
                        src={venue.host.avatar_url}
                        alt={venue.host.name}
                        className="w-14 h-14 rounded-full"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-[#2B2B2B]">{venue.host.name}</p>
                          {venue.host.verified && (
                            <Badge className="bg-blue-100 text-blue-800 text-xs">
                              <Shield className="h-3 w-3 mr-1" />
                              Verified Host
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          Hosting since {new Date(venue.host.joined_date).getFullYear()}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-600" />
                        <span>Responds within {venue.host.response_time_hours} hours</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-400" />
                        <span>{venue.host.response_rate}% response rate</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-[#2B2B2B]" />
                        <span>{venue.host.total_bookings} successful bookings</span>
                      </div>
                    </div>

                    {venue.host.bio && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-sm text-gray-600">{venue.host.bio}</p>
                      </div>
                    )}

                    <Separator className="my-4" />

                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      size="sm"
                      onClick={() => setShowContactModal(true)}
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Contact Host
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>

        {/* Booking Modal */}
        <Dialog open={showBookingModal} onOpenChange={setShowBookingModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-[#2B2B2B]">
                {venue.availability.instant_booking_enabled ? 'Book' : 'Request to Book'} {venue.name}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date" className="text-[#2B2B2B]">Event Date *</Label>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => date < new Date()}
                    className="rounded-md border border-gray-300"
                  />
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="start-time" className="text-[#2B2B2B]">Start Time *</Label>
                    <Input
                      id="start-time"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime((e.target as HTMLInputElement).value)}
                      className="border-gray-300"
                    />
                  </div>

                  <div>
                    <Label htmlFor="end-time" className="text-[#2B2B2B]">End Time *</Label>
                    <Input
                      id="end-time"
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime((e.target as HTMLInputElement).value)}
                      className="border-gray-300"
                    />
                  </div>

                  <div>
                    <Label htmlFor="guests" className="text-[#2B2B2B]">Number of Guests *</Label>
                    <Input
                      id="guests"
                      type="number"
                      placeholder="e.g., 50"
                      value={guestCount}
                      onChange={(e) => setGuestCount((e.target as HTMLInputElement).value)}
                      max={venue.capacity}
                      className="border-gray-300"
                    />
                  </div>

                  <div>
                    <Label htmlFor="event-type" className="text-[#2B2B2B]">Event Type *</Label>
                    <Select value={eventType} onValueChange={setEventType}>
                      <SelectTrigger className="border-gray-300">
                        <SelectValue placeholder="Select event type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="wedding">Wedding</SelectItem>
                        <SelectItem value="corporate">Corporate Event</SelectItem>
                        <SelectItem value="party">Party</SelectItem>
                        <SelectItem value="conference">Conference</SelectItem>
                        <SelectItem value="workshop">Workshop</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="description" className="text-[#2B2B2B]">Event Description</Label>
                <Textarea
                  id="description"
                  placeholder="Tell us about your event..."
                  value={eventDescription}
                  onChange={(e) => setEventDescription((e.target as HTMLInputElement).value)}
                  className="border-gray-300"
                />
              </div>

              <div>
                <Label htmlFor="special-requests" className="text-[#2B2B2B]">Special Requests</Label>
                <Textarea
                  id="special-requests"
                  placeholder="Any special setup or requirements..."
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests((e.target as HTMLInputElement).value)}
                  className="border-gray-300"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone" className="text-[#2B2B2B]">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone((e.target as HTMLInputElement).value)}
                    className="border-gray-300"
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="text-[#2B2B2B]">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail((e.target as HTMLInputElement).value)}
                    className="border-gray-300"
                  />
                </div>
              </div>

              {/* Pricing Breakdown */}
              {selectedDate && startTime && endTime && (
                <Card className="bg-gray-50 border border-gray-200">
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-[#2B2B2B] mb-3">Pricing Breakdown</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Total Hours</span>
                        <span>
                          {(() => {
                            const start = new Date(selectedDate);
                            const [startHour, startMinute] = startTime.split(':');
                            start.setHours(parseInt(startHour), parseInt(startMinute));

                            const end = new Date(selectedDate);
                            const [endHour, endMinute] = endTime.split(':');
                            end.setHours(parseInt(endHour), parseInt(endMinute));

                            return Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60 * 60));
                          })().toFixed(1)} hours
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Base Rate</span>
                        <span>${(() => {
                          const start = new Date(selectedDate);
                          const [startHour, startMinute] = startTime.split(':');
                          start.setHours(parseInt(startHour), parseInt(startMinute));

                          const end = new Date(selectedDate);
                          const [endHour, endMinute] = endTime.split(':');
                          end.setHours(parseInt(endHour), parseInt(endMinute));

                          const hours = Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60 * 60));
                          return (hours * venue.pricing.base_price_per_hour).toFixed(0);
                        })()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Cleaning Fee</span>
                        <span>${venue.pricing.cleaning_fee}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Service Fee</span>
                        <span>${(() => {
                          const start = new Date(selectedDate);
                          const [startHour, startMinute] = startTime.split(':');
                          start.setHours(parseInt(startHour), parseInt(startMinute));

                          const end = new Date(selectedDate);
                          const [endHour, endMinute] = endTime.split(':');
                          end.setHours(parseInt(endHour), parseInt(endMinute));

                          const hours = Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60 * 60));
                          const baseCost = hours * venue.pricing.base_price_per_hour;
                          return Math.round(baseCost * venue.pricing.service_fee_percentage);
                        })()}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-semibold text-[#2B2B2B]">
                        <span>Total</span>
                        <span>${calculateBookingTotal().toFixed(0)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowBookingModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleBookingSubmit}
                  className="flex-1 bg-[#2B2B2B] hover:bg-gray-800 text-white"
                  disabled={!selectedDate || !startTime || !endTime || !guestCount || !eventType || !contactPhone || !contactEmail}
                >
                  {venue.availability.instant_booking_enabled ? 'Book Now' : 'Submit Request'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Image Gallery Modal */}
        <Dialog open={showImageGallery} onOpenChange={setShowImageGallery}>
          <DialogContent className="max-w-6xl max-h-[90vh] p-0">
            <div className="relative">
              <button
                onClick={() => setShowImageGallery(false)}
                className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="aspect-video bg-black">
                <img
                  src={venue.media.gallery_images[currentImageIndex]}
                  alt={`${venue.name} ${currentImageIndex + 1}`}
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="absolute inset-y-0 left-4 flex items-center">
                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-black/50 hover:bg-black/70 text-white"
                  onClick={prevImage}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>

              <div className="absolute inset-y-0 right-4 flex items-center">
                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-black/50 hover:bg-black/70 text-white"
                  onClick={nextImage}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-black/70 text-white">
                  {currentImageIndex + 1} / {venue.media.gallery_images.length}
                </Badge>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Contact Host Modal */}
        <Dialog open={showContactModal} onOpenChange={setShowContactModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-[#2B2B2B]">Contact {venue.host.name}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <img
                  src={venue.host.avatar_url}
                  alt={venue.host.name}
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <p className="font-medium text-[#2B2B2B]">{venue.host.name}</p>
                  <p className="text-sm text-gray-600">Typically responds within {venue.host.response_time_hours} hours</p>
                </div>
              </div>

              <div className="space-y-3">
                <Button className="w-full justify-start" variant="outline">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Send Message
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Phone className="mr-2 h-4 w-4" />
                  Call Host
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Mail className="mr-2 h-4 w-4" />
                  Send Email
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default VenueDetails;