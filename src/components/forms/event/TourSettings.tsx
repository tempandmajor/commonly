import React, { useState } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Badge } from '@/components/ui/badge';
import { Calendar, Plus, Trash2, Music } from 'lucide-react';
import { DatePicker } from '@/components/forms/shared/DatePicker';
import { toast } from 'sonner';

interface TourDate {
  id: string;
  date: Date;
  venue: string;
  city: string;
  capacity?: number | undefined;
  ticketPrice?: number | undefined;
  notes?: string | undefined;
}

interface TourSettingsData {
  tourEnabled: boolean;
  tourName: string;
  tourDescription: string;
  tourDates: TourDate[];
  merchandiseAvailable: boolean;
  meetAndGreetAvailable: boolean;
  vipPackagesAvailable: boolean;
  transportationIncluded: boolean;
  accommodationIncluded: boolean;
}

interface TourSettingsProps {
  onSave?: (data: TourSettingsData) => void | undefined;
  initialData?: Partial<TourSettingsData> | undefined;
}

export const TourSettings: React.FC<TourSettingsProps> = ({ onSave, initialData }) => {
  const form = useForm<TourSettingsData>({
    defaultValues: {
      tourEnabled: false,
      tourName: '',
      tourDescription: '',
      tourDates: [],
      merchandiseAvailable: false,
      meetAndGreetAvailable: false,
      vipPackagesAvailable: false,
      transportationIncluded: false,
      accommodationIncluded: false,
          ...initialData,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'tourDates',
  });

  const tourEnabled = form.watch('tourEnabled');

  const handleAddTourDate = () => {
    append({
      id: Date.now().toString(),
      date: new Date(),
      venue: '',
      city: '',
      notes: '',
    });
  };

  const handleSave = (data: TourSettingsData) => {
    toast.success('Tour settings saved successfully');
    onSave?.(data);
  };

  return (
    <div className='max-w-4xl mx-auto p-6 space-y-6'>
      <div className='flex items-center gap-3 mb-6'>
        <Music className='h-6 w-6' />
        <h1 className='text-2xl font-bold'>Tour Settings</h1>
      </div>

      <form onSubmit={form.handleSubmit(handleSave)} className='space-y-6'>
        {/* Enable Tour Toggle */}
        <Card>
          <CardHeader>
            <CardTitle>Tour Configuration</CardTitle>
            <CardDescription>Configure your tour settings and dates</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='flex items-center justify-between'>
              <div>
                <Label className='text-base font-medium'>Enable Tour Mode</Label>
                <p className='text-sm text-muted-foreground'>
                  Turn this event into a multi-city tour
                </p>
              </div>
              <Controller
                name='tourEnabled'
                control={form.control}
                render={({ field }) => (
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
            </div>

            {tourEnabled && (
              <>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <Label htmlFor='tour-name'>Tour Name</Label>
                    <Controller
                      name='tourName'
                      control={form.control}
                      render={({ field }) => (
                        <Input id='tour-name' placeholder='e.g., World Tour 2024' {...field} />
                      )}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor='tour-description'>Tour Description</Label>
                  <Controller
                    name='tourDescription'
                    control={form.control}
                    render={({ field }) => (
                      <Textarea
                        id='tour-description'
                        placeholder='Describe your tour...'
                        rows={3}
                        {...field}
                      />
                    )}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Tour Dates */}
        {tourEnabled && (
          <Card>
            <CardHeader>
              <div className='flex items-center justify-between'>
                <div>
                  <CardTitle>Tour Dates</CardTitle>
                  <CardDescription>Add venues and dates for your tour</CardDescription>
                </div>
                <Button type='button' variant='outline' size='sm' onClick={handleAddTourDate}>
                  <Plus className='h-4 w-4 mr-2' />
                  Add Date
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {fields.length === 0 ? (
                <div className='text-center py-8 text-muted-foreground'>
                  <Calendar className='h-12 w-12 mx-auto mb-4 opacity-50' />
                  <p>No tour dates added yet.</p>
                  <p className='text-sm'>Add your first tour date to get started.</p>
                </div>
              ) : (
                <div className='space-y-4'>
                  {fields.map((field, index) => (
                    <Card key={field.id} className='p-4'>
                      <div className='flex items-start justify-between mb-4'>
                        <Badge variant='outline'>Date {index + 1}</Badge>
                        <Button
                          type='button'
                          variant='ghost'
                          size='sm'
                          onClick={() => remove(index)}
                        >
                          <Trash2 className='h-4 w-4' />
                        </Button>
                      </div>

                      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                        <div>
                          <Label>Date</Label>
                          <Controller
                            name={`tourDates.${index}.date`}
                            control={form.control}
                            render={({ field }) => (
                              <DatePicker
                                value={field.value}
                                onChange={field.onChange}
                                placeholder='Select date'
                              />
                            )}
                          />
                        </div>

                        <div>
                          <Label>Venue</Label>
                          <Controller
                            name={`tourDates.${index}.venue`}
                            control={form.control}
                            render={({ field }) => (
                              <Input placeholder='e.g., Madison Square Garden' {...field} />
                            )}
                          />
                        </div>

                        <div>
                          <Label>City</Label>
                          <Controller
                            name={`tourDates.${index}.city`}
                            control={form.control}
                            render={({ field }) => (
                              <Input placeholder='e.g., New York, NY' {...field} />
                            )}
                          />
                        </div>

                        <div>
                          <Label>Capacity (Optional)</Label>
                          <Controller
                            name={`tourDates.${index}.capacity`}
                            control={form.control}
                            render={({ field }) => (
                              <Input
                                type='number'
                                min='1'
                                placeholder='e.g., 20000'
                                value={field.value || ''}
                                onChange={e =>
                                  field.onChange(parseInt((e.target as HTMLInputElement).value) || undefined)
                                }
                              />
                            )}
                          />
                        </div>

                        <div>
                          <Label>Ticket Price ($)</Label>
                          <Controller
                            name={`tourDates.${index}.ticketPrice`}
                            control={form.control}
                            render={({ field }) => (
                              <Input
                                type='number'
                                min='0'
                                step='0.01'
                                placeholder='e.g., 75.00'
                                value={field.value || ''}
                                onChange={e =>
                                  field.onChange(parseFloat((e.target as HTMLInputElement).value) || undefined)
                                }
                              />
                            )}
                          />
                        </div>

                        <div className='md:col-span-2 lg:col-span-1'>
                          <Label>Notes (Optional)</Label>
                          <Controller
                            name={`tourDates.${index}.notes`}
                            control={form.control}
                            render={({ field }) => (
                              <Input placeholder='Special notes for this date' {...field} />
                            )}
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Additional Services */}
        {tourEnabled && (
          <Card>
            <CardHeader>
              <CardTitle>Additional Services</CardTitle>
              <CardDescription>Configure additional services for your tour</CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <Label className='text-base font-medium'>Merchandise Available</Label>
                    <p className='text-sm text-muted-foreground'>
                      Offer tour merchandise at venues
                    </p>
                  </div>
                  <Controller
                    name='merchandiseAvailable'
                    control={form.control}
                    render={({ field }) => (
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    )}
                  />
                </div>

                <div className='flex items-center justify-between'>
                  <div>
                    <Label className='text-base font-medium'>Meet & Greet</Label>
                    <p className='text-sm text-muted-foreground'>Offer meet and greet packages</p>
                  </div>
                  <Controller
                    name='meetAndGreetAvailable'
                    control={form.control}
                    render={({ field }) => (
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    )}
                  />
                </div>

                <div className='flex items-center justify-between'>
                  <div>
                    <Label className='text-base font-medium'>VIP Packages</Label>
                    <p className='text-sm text-muted-foreground'>Offer premium VIP experiences</p>
                  </div>
                  <Controller
                    name='vipPackagesAvailable'
                    control={form.control}
                    render={({ field }) => (
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    )}
                  />
                </div>

                <div className='flex items-center justify-between'>
                  <div>
                    <Label className='text-base font-medium'>Transportation</Label>
                    <p className='text-sm text-muted-foreground'>Include transportation options</p>
                  </div>
                  <Controller
                    name='transportationIncluded'
                    control={form.control}
                    render={({ field }) => (
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Save Button */}
        <div className='flex justify-end'>
          <Button type='submit' size='lg'>
            Save Tour Settings
          </Button>
        </div>
      </form>
    </div>
  );
};
