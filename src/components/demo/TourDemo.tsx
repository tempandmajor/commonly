import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TourDatesDisplay } from '@/components/events/TourDatesDisplay';
import type { TourDetails, TourDate } from '@/lib/types/event';

const TourDemo: React.FC = () => {
  // Sample tour data for demonstration
  const sampleTourDetails: TourDetails = {
    tourName: 'World Tour 2024',
    tourDescription:
      'An epic journey across continents bringing music to fans worldwide. Experience the magic of live performance in iconic venues.',
    tourType: 'international',
    tourDates: [
      {
        id: '1',
        date: new Date('2024-03-15'),
        startTime: '19:00',
        endTime: '22:00',
        venue: {
          name: 'Madison Square Garden',
          address: '4 Pennsylvania Plaza',
          city: 'New York',
          state: 'NY',
          country: 'United States',
        },
        ticketPrice: 89.99,
        capacity: 20000,
        status: 'on_sale',
        specialNotes:
          'VIP meet & greet packages available. Limited edition tour merchandise will be sold at the venue.',
      },
      {
        id: '2',
        date: new Date('2024-03-22'),
        startTime: '20:00',
        endTime: '23:00',
        venue: {
          name: 'The Hollywood Bowl',
          address: '2301 Highland Ave',
          city: 'Los Angeles',
          state: 'CA',
          country: 'United States',
        },
        ticketPrice: 95.0,
        capacity: 17500,
        status: 'on_sale',
        specialNotes:
          'Outdoor venue - bring a light jacket. Food and beverages available for purchase.',
      },
      {
        id: '3',
        date: new Date('2024-04-05'),
        startTime: '19:30',
        endTime: '22:30',
        venue: {
          name: 'O2 Arena',
          address: 'Peninsula Square',
          city: 'London',
          state: 'England',
          country: 'United Kingdom',
        },
        ticketPrice: 75.0,
        capacity: 20000,
        status: 'sold_out',
        specialNotes:
          'This show is completely sold out. Check official resale platforms for last-minute tickets.',
      },
      {
        id: '4',
        date: new Date('2024-04-12'),
        startTime: '19:00',
        endTime: '22:00',
        venue: {
          name: 'Accor Arena',
          address: '8 Boulevard de Bercy',
          city: 'Paris',
          state: 'Île-de-France',
          country: 'France',
        },
        ticketPrice: 80.0,
        capacity: 20300,
        status: 'on_sale',
        specialNotes: 'Concert en français et anglais. Merchandise exclusif disponible.',
      },
      {
        id: '5',
        date: new Date('2024-02-14'),
        startTime: '20:00',
        endTime: '23:00',
        venue: {
          name: 'Sydney Opera House',
          address: 'Bennelong Point',
          city: 'Sydney',
          state: 'NSW',
          country: 'Australia',
        },
        ticketPrice: 120.0,
        capacity: 2700,
        status: 'completed',
        specialNotes: "Valentine's Day special show - an intimate acoustic performance.",
      },
    ],
    tourManager: {
      name: 'Sarah Johnson',
      email: 'sarah.johnson@tourmanagement.com',
      phone: '+1 (555) 123-4567',
    },
    merchandiseAvailable: true,
    vipPackagesAvailable: true,
    totalTourCapacity: 80500,
    estimatedTourRevenue: 6840000,
  };

  const handleBookTicket = (tourDate: TourDate) => {
    // In a real app, this would redirect to ticket booking
    alert(
      `Redirecting to ticket booking for ${tourDate.venue.name} on ${new Date(tourDate.date).toLocaleDateString()}`
    );
  };

  return (
    <div className='max-w-4xl mx-auto p-6'>
      <Card className='mb-6'>
        <CardHeader>
          <CardTitle>🎵 Tour Functionality Demo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            <p className='text-muted-foreground'>
              This demo showcases the new tour functionality for events with multiple dates and
              locations. Perfect for music tours, comedy tours, theater productions, and any
              multi-city events.
            </p>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg'>
              <div className='text-center'>
                <div className='text-2xl font-bold text-primary'>5</div>
                <div className='text-sm text-muted-foreground'>Tour Dates</div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold text-primary'>80,500</div>
                <div className='text-sm text-muted-foreground'>Total Capacity</div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold text-primary'>$6.8M</div>
                <div className='text-sm text-muted-foreground'>Est. Revenue</div>
              </div>
            </div>

            <div className='p-4 bg-blue-50 border border-blue-200 rounded-lg'>
              <h4 className='font-medium text-blue-800 mb-2'>✨ Key Features</h4>
              <ul className='text-sm text-blue-700 space-y-1'>
                <li>• Multiple dates with different venues and locations</li>
                <li>• Individual ticket pricing per date</li>
                <li>• Venue capacity management</li>
                <li>• Tour status tracking (scheduled, on sale, sold out, etc.)</li>
                <li>• Tour manager contact information</li>
                <li>• Merchandise and VIP package options</li>
                <li>• Expandable date details with full venue information</li>
                <li>• Automatic separation of upcoming vs. past dates</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <TourDatesDisplay tourDetails={sampleTourDetails} onBookTicket={handleBookTicket} />
    </div>
  );
};

export default TourDemo;
