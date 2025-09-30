import { useEventTickets } from '@/hooks/useEventTickets';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { format } from 'date-fns';

interface EventSupportersProps {
  eventId: string;
  isOrganizer: boolean;
}

const EventSupporters = ({ eventId, isOrganizer }: EventSupportersProps) => {
  const { tickets, loading, error } = useEventTickets(eventId);

  if (!isOrganizer) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Event Supporters</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className='flex justify-center py-8'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
          </div>
        ) : error ? (
          <p className='text-destructive text-center'>{error}</p>
        ) : tickets.length === 0 ? (
          <p className='text-muted-foreground text-center'>No supporters yet</p>
        ) : (
          <div className='space-y-4'>
            {tickets.map(ticket => (
              <div
                key={ticket.id}
                className='flex items-center justify-between p-4 border rounded-lg'
              >
                <div className='flex items-center space-x-4'>
                  <Avatar>
                    <AvatarFallback>{(ticket.userId || 'U').charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className='font-medium'>{ticket.userId}</p>
                    <p className='text-sm text-muted-foreground'>
                      Purchased on {format(ticket.purchaseDate, 'PPP')}
                    </p>
                  </div>
                </div>
                <div className='text-right'>
                  <p className='font-medium'>${ticket.price.toFixed(2)}</p>
                  <p className='text-sm text-muted-foreground'>Status: {ticket.status}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EventSupporters;
