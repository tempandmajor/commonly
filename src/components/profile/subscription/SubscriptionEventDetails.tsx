import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CalendarDays, Clock, Users } from 'lucide-react';

interface SubscriptionEventDetailsProps {
  title: string;
  description: string;
  schedule: string;
  time: string;
  location: string;
}

const SubscriptionEventDetails = ({
  title,
  description,
  schedule,
  time,
  location,
}: SubscriptionEventDetailsProps) => {
  return (
    <Card className='mb-4 bg-secondary/30'>
      <CardHeader className='pb-2'>
        <CardTitle className='text-lg'>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='space-y-2'>
          <div className='flex items-start'>
            <CalendarDays className='mr-2 h-4 w-4 mt-0.5 text-primary' />
            <span>{schedule}</span>
          </div>
          <div className='flex items-start'>
            <Clock className='mr-2 h-4 w-4 mt-0.5 text-primary' />
            <span>{time}</span>
          </div>
          <div className='flex items-start'>
            <Users className='mr-2 h-4 w-4 mt-0.5 text-primary' />
            <span>{location}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SubscriptionEventDetails;
