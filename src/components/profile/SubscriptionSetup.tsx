import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Calendar, DollarSign, Save, Plus, X } from 'lucide-react';
import SubscriptionButton from '../payment/SubscriptionButton';

interface SubscriptionSetupProps {
  onClose: () => void;
}

const SubscriptionSetup = ({ onClose }: SubscriptionSetupProps) => {
  const [title, setTitle] = useState('Monthly Creator Hangout');
  const [description, setDescription] = useState(
    'Join me every month for exclusive content, Q&A sessions, and networking with other subscribers.'
  );
  const [frequency, setFrequency] = useState('monthly');
  const [dayOfMonth, setDayOfMonth] = useState('last-friday');
  const [time, setTime] = useState('19:00');
  const [duration, setDuration] = useState('2');
  const [monthlyPrice, setMonthlyPrice] = useState('19.99');
  const [yearlyPrice, setYearlyPrice] = useState('199.99');
  const [location, setLocation] = useState('virtual');
  const [perks, setPerks] = useState([
    'Early access to new event announcements',
    'Exclusive content and behind-the-scenes',
    'Direct Q&A sessions with the creator',
    'Networking opportunities with other subscribers',
  ]);
  const [newPerk, setNewPerk] = useState('');

  const handleAddPerk = () => {
    if (newPerk.trim()) {
      setPerks([...perks, newPerk.trim()]);
      setNewPerk('');
    }
  };

  const handleRemovePerk = (index: number) => {
    setPerks(perks.filter((_, i) => i !== index));
  };

  const handleSaveSubscription = () => {
    toast.success('Subscription settings saved successfully');
    onClose();
  };

  const handleSubscribeSuccess = () => {
    toast.success("Successfully subscribed! You'll receive a confirmation email shortly.");
    onClose();
  };

  const handleSubscribeError = (error: Error) => {
    toast.error('There was a problem processing your subscription. Please try again.');
  };

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h2 className='text-2xl font-bold'>Subscription Settings</h2>
        <Button variant='outline' size='sm' onClick={onClose}>
          <X className='h-4 w-4 mr-1' /> Close
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Event Details</CardTitle>
          <CardDescription>Configure your recurring subscription event</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='title'>Event Title</Label>
            <Input
              id='title'
              value={title}
              onChange={e => setTitle((e.target as HTMLInputElement).value)}
              placeholder='Monthly Creator Hangout'
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='description'>Description</Label>
            <Textarea
              id='description'
              value={description}
              onChange={e => setDescription((e.target as HTMLInputElement).value)}
              placeholder='Describe your recurring event'
              rows={3}
            />
          </div>

          <div className='grid gap-4 md:grid-cols-2'>
            <div className='space-y-2'>
              <Label htmlFor='frequency'>Frequency</Label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger id='frequency'>
                  <SelectValue placeholder='Select frequency' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='weekly'>Weekly</SelectItem>
                  <SelectItem value='biweekly'>Bi-Weekly</SelectItem>
                  <SelectItem value='monthly'>Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='day'>Day</Label>
              <Select value={dayOfMonth} onValueChange={setDayOfMonth}>
                <SelectTrigger id='day'>
                  <SelectValue placeholder='Select day' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='first-monday'>First Monday</SelectItem>
                  <SelectItem value='second-tuesday'>Second Tuesday</SelectItem>
                  <SelectItem value='third-wednesday'>Third Wednesday</SelectItem>
                  <SelectItem value='last-friday'>Last Friday</SelectItem>
                  <SelectItem value='specific-date'>Specific Date (e.g., 15th)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='grid gap-4 md:grid-cols-2'>
            <div className='space-y-2'>
              <Label htmlFor='time'>Start Time</Label>
              <Input id='time' type='time' value={time} onChange={e => setTime((e.target as HTMLInputElement).value)} />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='duration'>Duration (hours)</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger id='duration'>
                  <SelectValue placeholder='Select duration' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='1'>1 hour</SelectItem>
                  <SelectItem value='1.5'>1.5 hours</SelectItem>
                  <SelectItem value='2'>2 hours</SelectItem>
                  <SelectItem value='3'>3 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='location'>Location</Label>
            <Select value={location} onValueChange={setLocation}>
              <SelectTrigger id='location'>
                <SelectValue placeholder='Select location' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='virtual'>Virtual (Zoom)</SelectItem>
                <SelectItem value='physical'>Physical Location</SelectItem>
                <SelectItem value='hybrid'>Hybrid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pricing</CardTitle>
          <CardDescription>Set your subscription pricing</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid gap-4 md:grid-cols-2'>
            <div className='space-y-2'>
              <Label htmlFor='monthly-price'>Monthly Price ($)</Label>
              <div className='relative'>
                <DollarSign className='absolute left-3 top-2.5 h-4 w-4 text-muted-foreground' />
                <Input
                  id='monthly-price'
                  type='number'
                  min='0'
                  step='0.01'
                  className='pl-9'
                  value={monthlyPrice}
                  onChange={e => setMonthlyPrice((e.target as HTMLInputElement).value)}
                />
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='yearly-price'>Yearly Price ($)</Label>
              <div className='relative'>
                <DollarSign className='absolute left-3 top-2.5 h-4 w-4 text-muted-foreground' />
                <Input
                  id='yearly-price'
                  type='number'
                  min='0'
                  step='0.01'
                  className='pl-9'
                  value={yearlyPrice}
                  onChange={e => setYearlyPrice((e.target as HTMLInputElement).value)}
                />
              </div>
              <p className='text-xs text-muted-foreground'>
                {parseFloat(monthlyPrice) * 12 - parseFloat(yearlyPrice) > 0
                  ? `Subscribers save $${(parseFloat(monthlyPrice) * 12 - parseFloat(yearlyPrice)).toFixed(2)} with yearly billing`
                  : 'Consider offering a discount for yearly subscriptions'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Subscription Benefits</CardTitle>
          <CardDescription>What will subscribers get?</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='space-y-4'>
            <div className='flex gap-2'>
              <Input
                value={newPerk}
                onChange={e => setNewPerk((e.target as HTMLInputElement).value)}
                placeholder='Add a new benefit...'
                className='flex-1'
              />
              <Button type='button' onClick={handleAddPerk} variant='outline'>
                <Plus className='h-4 w-4 mr-1' /> Add
              </Button>
            </div>

            <div className='space-y-2'>
              {perks.map((perk, index) => (
                <div
                  key={index}
                  className='flex items-center justify-between rounded-md border p-2'
                >
                  <span>{perk}</span>
                  <Button variant='ghost' size='sm' onClick={() => handleRemovePerk(index)}>
                    <X className='h-4 w-4' />
                  </Button>
                </div>
              ))}
              {perks.length === 0 && (
                <p className='text-sm text-muted-foreground'>
                  Add some benefits for your subscribers
                </p>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className='flex flex-col gap-4'>
          <Button onClick={handleSaveSubscription} className='w-full'>
            <Save className='mr-2 h-4 w-4' /> Save Subscription Settings
          </Button>

          <div className='w-full border-t pt-4'>
            <SubscriptionButton
              planTitle={title}
              planDescription={description}
              price={parseFloat(monthlyPrice)}
              variant='outline'
              className='w-full'
              onSubscribeSuccess={handleSubscribeSuccess}
              onSubscribeError={handleSubscribeError}
            >
              <Calendar className='mr-2 h-4 w-4' />
              Test Subscription ($
              {parseFloat(monthlyPrice).toFixed(2)}/month)
            </SubscriptionButton>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SubscriptionSetup;
