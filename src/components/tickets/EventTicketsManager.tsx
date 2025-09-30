import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEventTickets } from '@/hooks/useEventTickets';
import { Button } from '@/components/ui/button';
import { RefreshCcw, Ticket, UserCheck, UserX } from 'lucide-react';
import TicketScanner from './TicketScanner';
import { Ticket as TicketType } from '@/services/ticketService';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';

interface EventTicketsManagerProps {
  eventId: string;
  isOrganizer: boolean;
}

const EventTicketsManager: React.FC<EventTicketsManagerProps> = ({ eventId, isOrganizer }) => {
  const { tickets, loading, error, refreshTickets } = useEventTickets(eventId);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('valid');

  if (!isOrganizer) {
    return (
      <Card>
        <CardContent className='pt-6'>
          <div className='text-center'>
            <p className='text-muted-foreground'>
              You don't have permission to manage tickets for this event.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const validTickets = tickets.filter(ticket => ticket.status === 'valid');
  const usedTickets = tickets.filter(ticket => ticket.status === 'used');
  const allTickets = tickets;

  // Apply search filter
  const filteredTickets = {
    valid: validTickets.filter(
      ticket =>
        ticket.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.ticketCode.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    used: usedTickets.filter(
      ticket =>
        ticket.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.ticketCode.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    all: allTickets.filter(
      ticket =>
        ticket.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.ticketCode.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  };

  const handleTicketValidated = (ticket: TicketType) => {
    refreshTickets();
  };

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <div className='flex flex-col md:flex-row md:items-center justify-between'>
            <CardTitle className='text-xl'>Event Tickets</CardTitle>
            <Button variant='outline' size='sm' onClick={refreshTickets} disabled={loading}>
              <RefreshCcw className='mr-2 h-4 w-4' />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className='space-y-6'>
            {loading ? (
              <div className='flex justify-center py-8'>
                <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary'></div>
              </div>
            ) : error ? (
              <div className='bg-destructive/10 p-4 rounded-lg text-center'>
                <p className='text-destructive font-medium'>{error}</p>
                <Button variant='outline' onClick={refreshTickets} className='mt-4'>
                  Try Again
                </Button>
              </div>
            ) : (
              <div className='space-y-4'>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                  <Card>
                    <CardContent className='pt-6'>
                      <div className='flex flex-col items-center'>
                        <div className='h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-2'>
                          <Ticket className='h-6 w-6 text-primary' />
                        </div>
                        <p className='text-lg font-semibold'>{tickets.length}</p>
                        <p className='text-sm text-muted-foreground'>Total Tickets</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className='pt-6'>
                      <div className='flex flex-col items-center'>
                        <div className='h-12 w-12 rounded-full bg-success/10 flex items-center justify-center mb-2'>
                          <UserCheck className='h-6 w-6 text-success' />
                        </div>
                        <p className='text-lg font-semibold'>{validTickets.length}</p>
                        <p className='text-sm text-muted-foreground'>Valid Tickets</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className='pt-6'>
                      <div className='flex flex-col items-center'>
                        <div className='h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-2'>
                          <UserX className='h-6 w-6 text-muted-foreground' />
                        </div>
                        <p className='text-lg font-semibold'>{usedTickets.length}</p>
                        <p className='text-sm text-muted-foreground'>Used Tickets</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <TicketScanner eventId={eventId} onTicketValidated={handleTicketValidated} />

                <div className='space-y-4'>
                  <Input
                    placeholder='Search by name or ticket code...'
                    value={searchQuery}
                    onChange={e => setSearchQuery((e.target as HTMLInputElement).value)}
                  />

                  <Tabs defaultValue='valid' value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className='mb-4'>
                      <TabsTrigger value='valid'>
                        Valid Tickets ({filteredTickets.valid.length})
                      </TabsTrigger>
                      <TabsTrigger value='used'>
                        Used Tickets ({filteredTickets.used.length})
                      </TabsTrigger>
                      <TabsTrigger value='all'>
                        All Tickets ({filteredTickets.all.length})
                      </TabsTrigger>
                    </TabsList>

                    <TicketsTable
                      tickets={filteredTickets[activeTab as keyof typeof filteredTickets]}
                    />
                  </Tabs>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const TicketsTable: React.FC<{ tickets: TicketType[] }> = ({ tickets }) => {
  return (
    <div className='border rounded-lg overflow-hidden'>
      <div className='overflow-x-auto'>
        <table className='w-full'>
          <thead>
            <tr className='bg-muted/50'>
              <th className='px-4 py-3 text-left text-sm font-medium'>Attendee</th>
              <th className='px-4 py-3 text-left text-sm font-medium'>Ticket Code</th>
              <th className='px-4 py-3 text-left text-sm font-medium'>Purchase Date</th>
              <th className='px-4 py-3 text-left text-sm font-medium'>Status</th>
              <th className='px-4 py-3 text-left text-sm font-medium'>Validated</th>
            </tr>
          </thead>
          <tbody className='divide-y'>
            {tickets.length === 0 ? (
              <tr>
                <td colSpan={5} className='px-4 py-8 text-center text-muted-foreground'>
                  No tickets found
                </td>
              </tr>
            ) : (
              tickets.map(ticket => (
                <tr key={ticket.id} className='hover:bg-muted/20'>
                  <td className='px-4 py-4 text-sm'>{ticket.userName}</td>
                  <td className='px-4 py-4 text-sm font-mono'>{ticket.ticketCode}</td>
                  <td className='px-4 py-4 text-sm'>
                    {format(ticket.purchaseDate, 'MMM d, yyyy')}
                  </td>
                  <td className='px-4 py-4 text-sm'>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        ticket.status === 'valid'
                          ? 'bg-success/20 text-success'
                          : ticket.status === 'used'
                            ? 'bg-muted text-muted-foreground'
                            : 'bg-destructive/20 text-destructive'
                      }`}
                    >
                      {ticket.status}
                    </span>
                  </td>
                  <td className='px-4 py-4 text-sm'>
                    {ticket.validatedAt ? format(ticket.validatedAt, 'MMM d, yyyy') : '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EventTicketsManager;
