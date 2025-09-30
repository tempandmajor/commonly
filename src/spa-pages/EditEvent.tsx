import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';
import SimpleHeader from '@/components/layout/SimpleHeader';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Calendar,
  Clock,
  MapPin,
  DollarSign,
  Users,
  Tag,
  ImageIcon,
  Save,
  ArrowLeft,
  AlertTriangle,
  Trash2,
  Eye,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/ui/loading';

interface EventFormData {
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  location: string;
  venue_id?: string | undefined;
  price: number;
  max_capacity: number;
  image_url: string;
  is_public: boolean;
}

interface Venue {
  id: string;
  name: string;
}

const EditEvent = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [eventData, setEventData] = useState<EventFormData>({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    location: '',
    venue_id: '',
    price: 0,
    max_capacity: 50,
    image_url: '',
    is_public: false,
  });
  const [venues, setVenues] = useState<Venue[]>([]);
  const [newTag, setNewTag] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const categories = [
    'Conference',
    'Workshop',
    'Networking',
    'Social',
    'Educational',
    'Entertainment',
    'Sports',
    'Arts',
    'Music',
    'Food & Drink',
    'Other',
  ];

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    loadEventData();
    loadVenues();
  }, [id, user, navigate]);

  const loadEventData = async () => {
    if (!id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      const { data: event, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (!event) {
        toast.error('Event not found');
        navigate('/dashboard');
        return;
      }

      // Check if user owns this event
      if (event.creator_id !== user?.id) {
        toast.error('You do not have permission to edit this event');
        navigate('/dashboard');
        return;
      }

      // Convert database event to form data using actual schema
      const startDate = new Date(event.start_date);
      const endDate = new Date(event.end_date);

      setEventData({
        title: event.title || '',
        description: event.description || '',
        start_date: startDate.toISOString().slice(0, 16),
        end_date: endDate.toISOString().slice(0, 16),
        location: event.location || '',
        venue_id: event.venue_id || '',
        price: event.price || 0,
        max_capacity: event.max_capacity || 50,
        image_url: event.image_url || '',
        is_public: event.is_public || false,
      });
    } catch (error) {
      toast.error('Failed to load event data');
      navigate('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const loadVenues = async () => {
    try {
      const { data, error } = await supabase
        .from('venues')
        .select('id, name')
        .eq('status', 'approved')
        .order('name');

      if (error) {
        return;
      }

      if (data) {
        setVenues(data as Venue[]);
      }
    } catch (_error) {
      // Error handling silently ignored
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!eventData.title.trim()) {
      newErrors.title = 'Event title is required';
    }

    if (!eventData.description.trim()) {
      newErrors.description = 'Event description is required';
    }

    if (!eventData.start_date) {
      newErrors.start_date = 'Event start date is required';
    } else {
      const startDate = new Date(eventData.start_date);
      if (startDate <= new Date()) {
        newErrors.start_date = 'Event start date must be in the future';
      }
    }

    if (!eventData.end_date) {
      newErrors.end_date = 'Event end date is required';
    } else if (eventData.start_date && eventData.end_date) {
      const startDate = new Date(eventData.start_date);
      const endDate = new Date(eventData.end_date);
      if (endDate <= startDate) {
        newErrors.end_date = 'Event end date must be after start date';
      }
    }

    if (!eventData.location.trim() && !eventData.venue_id) {
      newErrors.location = 'Either location or venue must be specified';
    }

    if (eventData.price < 0) {
      newErrors.price = 'Price cannot be negative';
    }

    if (eventData.max_capacity < 1) {
      newErrors.max_capacity = 'Maximum capacity must be at least 1';
    }

    setErrors(newErrors);

    return (Object.keys(newErrors) as (keyof typeof newErrors)[]).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error('Please fix the form errors before saving');
      return;
    }

    setSaving(true);
    try {
      const updateData = {
        title: eventData.title,
        description: eventData.description,
        start_date: new Date(eventData.start_date).toISOString(),
        end_date: new Date(eventData.end_date).toISOString(),
        location: eventData.location,
        venue_id: eventData.venue_id || null,
        price: eventData.price,
        max_capacity: eventData.max_capacity,
        image_url: eventData.image_url,
        is_public: eventData.is_public,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('events').update(updateData).eq('id', id);

      if (error) throw error;

      toast.success('Event updated successfully!');
      navigate(`/events/${id}`);
    } catch (error) {
      toast.error('Failed to update event');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      const { error } = await supabase.from('events').delete().eq('id', id);

      if (error) throw error;

      toast.success('Event deleted successfully');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Failed to delete event');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleInputChange = (field: keyof EventFormData, value: unknown) => {
    setEventData(prev => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (isLoading) {
    return (
      <div className='flex min-h-screen flex-col'>
        <SimpleHeader />
        <main className='flex-1 container py-8'>
          <div className='max-w-4xl mx-auto'>
            <div className='flex justify-center items-center h-64'>
              <LoadingSpinner size='lg' />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className='flex min-h-screen flex-col'>
      <SimpleHeader />

      <main className='flex-1 container py-8'>
        <div className='max-w-4xl mx-auto'>
          {/* Header */}
          <div className='flex items-center justify-between mb-6'>
            <div className='flex items-center gap-4'>
              <Button
                variant='ghost'
                onClick={() => navigate(-1)}
                className='flex items-center gap-2'
              >
                <ArrowLeft className='w-4 h-4' />
                Back
              </Button>
              <div>
                <h1 className='text-3xl font-bold'>Edit Event</h1>
                <p className='text-muted-foreground'>Update your event details</p>
              </div>
            </div>

            <div className='flex items-center gap-2'>
              <Button
                variant='outline'
                onClick={() => navigate(`/events/${id}`)}
                className='flex items-center gap-2'
              >
                <Eye className='w-4 h-4' />
                Preview
              </Button>
              <Button
                variant='destructive'
                disabled={isDeleting}
                onClick={handleDelete}
                className='flex items-center gap-2'
              >
                {isDeleting ? (
                  <LoadingSpinner size='small' className='mr-2' />
                ) : (
                  <Trash2 className='w-4 h-4' />
                )}
                Delete
              </Button>
            </div>
          </div>

          <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
            {/* Main Form */}
            <div className='lg:col-span-2 space-y-6'>
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Tag className='w-5 h-5' />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div>
                    <Label htmlFor='title'>Event Title *</Label>
                    <Input
                      id='title'
                      value={eventData.title}
                      onChange={e => handleInputChange('title', (e.target as HTMLInputElement).value)}
                      placeholder='Enter event title'
                      className={errors.title ? 'border-destructive' : ''}
                    />
                    {errors.title && <p className='text-sm text-destructive mt-1'>{errors.title}</p>}
                  </div>

                  <div>
                    <Label htmlFor='description'>Description *</Label>
                    <Textarea
                      id='description'
                      value={eventData.description}
                      onChange={e => handleInputChange('description', e.target.value)}
                      placeholder='Describe your event...'
                      rows={4}
                      className={errors.description ? 'border-destructive' : ''}
                    />
                    {errors.description && (
                      <p className='text-sm text-destructive mt-1'>{errors.description}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor='image_url'>Event Image URL</Label>
                    <Input
                      id='image_url'
                      value={eventData.image_url}
                      onChange={e => handleInputChange('image_url', (e.target as HTMLInputElement).value)}
                      placeholder='https://example.com/image.jpg'
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Date & Time */}
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Calendar className='w-5 h-5' />
                    Date & Time
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div>
                      <Label htmlFor='start_date'>Event Start Date *</Label>
                      <Input
                        id='start_date'
                        type='datetime-local'
                        value={eventData.start_date}
                        onChange={e => handleInputChange('start_date', (e.target as HTMLInputElement).value)}
                        className={errors.start_date ? 'border-destructive' : ''}
                      />
                      {errors.start_date && (
                        <p className='text-sm text-destructive mt-1'>{errors.start_date}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor='end_date'>Event End Date *</Label>
                      <Input
                        id='end_date'
                        type='datetime-local'
                        value={eventData.end_date}
                        onChange={e => handleInputChange('end_date', (e.target as HTMLInputElement).value)}
                        className={errors.end_date ? 'border-destructive' : ''}
                      />
                      {errors.end_date && (
                        <p className='text-sm text-destructive mt-1'>{errors.end_date}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Location */}
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <MapPin className='w-5 h-5' />
                    Location
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div>
                    <Label htmlFor='venue'>Select Venue (Optional)</Label>
                    <Select
                      value={eventData.venue_id}
                      onValueChange={value => handleInputChange('venue_id', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Choose a venue' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value=''>No venue selected</SelectItem>
                        {venues.map(venue => (
                          <SelectItem key={venue.id} value={venue.id}>
                            {venue.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor='location'>Custom Location</Label>
                    <Input
                      id='location'
                      value={eventData.location}
                      onChange={e => handleInputChange('location', (e.target as HTMLInputElement).value)}
                      placeholder='Enter event location'
                      className={errors.location ? 'border-destructive' : ''}
                    />
                    {errors.location && (
                      <p className='text-sm text-destructive mt-1'>{errors.location}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className='space-y-6'>
              {/* Pricing & Capacity */}
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <DollarSign className='w-5 h-5' />
                    Pricing & Capacity
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div>
                    <Label htmlFor='price'>Ticket Price ($)</Label>
                    <Input
                      id='price'
                      type='number'
                      min='0'
                      step='0.01'
                      value={eventData.price}
                      onChange={e => handleInputChange('price', parseFloat((e.target as HTMLInputElement).value) || 0)}
                      className={errors.price ? 'border-destructive' : ''}
                    />
                    {errors.price && <p className='text-sm text-destructive mt-1'>{errors.price}</p>}
                  </div>

                  <div>
                    <Label htmlFor='max_capacity'>Maximum Capacity</Label>
                    <Input
                      id='max_capacity'
                      type='number'
                      min='1'
                      value={eventData.max_capacity}
                      onChange={e =>
                        handleInputChange('max_capacity', parseInt((e.target as HTMLInputElement).value) || 0)
                      }
                      className={errors.max_capacity ? 'border-destructive' : ''}
                    />
                    {errors.max_capacity && (
                      <p className='text-sm text-destructive mt-1'>{errors.max_capacity}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Event Settings</CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <Label>Published</Label>
                      <p className='text-sm text-muted-foreground'>Make event visible to public</p>
                    </div>
                    <Switch
                      checked={eventData.is_public}
                      onCheckedChange={checked => handleInputChange('is_public', checked)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Save Actions */}
              <Card>
                <CardContent className='p-4'>
                  <div className='space-y-3'>
                    <Button disabled={isSaving} onClick={handleSave} className='w-full' size='lg'>
                      {isSaving ? (
                        <LoadingSpinner size='small' className='mr-2' />
                      ) : (
                        <Save className='w-4 h-4 mr-2' />
                      )}
                      Save Changes
                    </Button>

                    <Button variant='outline' onClick={() => navigate(-1)} className='w-full'>
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default EditEvent;
