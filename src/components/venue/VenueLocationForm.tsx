import { useStripeConnect } from '@/hooks/useStripeConnect';
import { useLocation } from 'react-router-dom';
import StripeConnectRequired from '@/components/payment/connect/StripeConnectRequired';
import VenueOwnerVerification from '@/components/venue/VenueOwnerVerification';
import { useIdentityVerification } from '@/hooks/useIdentityVerification';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface VenueLocationFormProps {
  // Form props will go here
  // For now, keeping this minimal as we don't have the actual venue form component
}

const VenueLocationForm = ({}: VenueLocationFormProps) => {
  const { hasStripeConnect, isLoading } = useStripeConnect();
  const { verificationStatus, isVerified } = useIdentityVerification();
  const location = useLocation();

  if (isLoading) {
    return <StripeConnectRequired type='venue' isLoading={true} />;
  }

  if (!hasStripeConnect) {
    return <StripeConnectRequired type='venue' returnPath={location.pathname} />;
  }

  // If the user hasn't been verified, show the verification card
  if (verificationStatus !== 'verified') {
    return (
      <div className='space-y-6'>
        <h2 className='text-2xl font-bold'>Create Your Venue</h2>
        <p className='text-muted-foreground'>
          Before you can list your venue, we need to verify your identity for security purposes.
        </p>
        <VenueOwnerVerification className='mt-6' />
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <h2 className='text-2xl font-bold'>Create Your Venue</h2>
      <p className='text-muted-foreground'>
        Fill out the details below to list your venue on our platform.
      </p>

      <VenueOwnerVerification className='mb-8' />

      <Card>
        <CardHeader>
          <CardTitle>Venue Details</CardTitle>
          <CardDescription>
            Provide information about your venue to help customers find and book your space.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <label htmlFor='venue-name' className='text-sm font-medium'>
                Venue Name
              </label>
              <input
                id='venue-name'
                className='w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary'
                placeholder='Enter your venue name'
              />
            </div>
            <div className='space-y-2'>
              <label htmlFor='venue-type' className='text-sm font-medium'>
                Venue Type
              </label>
              <select
                id='venue-type'
                className='w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary'
              >
                <option value=''>Select venue type</option>
                <option value='wedding'>Wedding Venue</option>
                <option value='corporate'>Corporate Space</option>
                <option value='party'>Party Venue</option>
                <option value='conference'>Conference Center</option>
                <option value='other'>Other</option>
              </select>
            </div>
          </div>

          <div className='space-y-2'>
            <label htmlFor='venue-description' className='text-sm font-medium'>
              Description
            </label>
            <textarea
              id='venue-description'
              rows={4}
              className='w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary'
              placeholder='Describe your venue, amenities, and what makes it special'
            />
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div className='space-y-2'>
              <label htmlFor='capacity' className='text-sm font-medium'>
                Capacity
              </label>
              <input
                id='capacity'
                type='number'
                className='w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary'
                placeholder='Maximum guests'
              />
            </div>
            <div className='space-y-2'>
              <label htmlFor='price-per-hour' className='text-sm font-medium'>
                Price per Hour ($)
              </label>
              <input
                id='price-per-hour'
                type='number'
                className='w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary'
                placeholder='0.00'
              />
            </div>
            <div className='space-y-2'>
              <label htmlFor='minimum-hours' className='text-sm font-medium'>
                Minimum Hours
              </label>
              <input
                id='minimum-hours'
                type='number'
                className='w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary'
                placeholder='2'
              />
            </div>
          </div>

          <div className='space-y-2'>
            <label htmlFor='venue-address' className='text-sm font-medium'>
              Address
            </label>
            <input
              id='venue-address'
              className='w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary'
              placeholder='Enter your venue address'
            />
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div className='space-y-2'>
              <label htmlFor='city' className='text-sm font-medium'>
                City
              </label>
              <input
                id='city'
                className='w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary'
                placeholder='City'
              />
            </div>
            <div className='space-y-2'>
              <label htmlFor='state' className='text-sm font-medium'>
                State
              </label>
              <input
                id='state'
                className='w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary'
                placeholder='State'
              />
            </div>
            <div className='space-y-2'>
              <label htmlFor='zipcode' className='text-sm font-medium'>
                ZIP Code
              </label>
              <input
                id='zipcode'
                className='w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary'
                placeholder='ZIP Code'
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button className='w-full'>Create Venue Listing</Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default VenueLocationForm;
