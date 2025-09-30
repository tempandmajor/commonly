import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Ticket as TicketType, mintTicketToken } from '@/services/ticketService';
import { format } from 'date-fns';
import { Ticket, DollarSign, Barcode } from 'lucide-react';
import QRCode from 'qrcode.react';
import { Button } from '@/components/ui/button';

interface TicketCardProps {
  ticket: TicketType;
  showQR?: boolean | undefined;
  onShowQR?: () => void | undefined;
}

const TicketCard: React.FC<TicketCardProps> = ({ ticket, showQR = false, onShowQR }) => {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const run = async () => {
      if (!showQR) return;
      setLoading(true);
      try {
        const t = await mintTicketToken(ticket.id);
        setToken(t);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [showQR, ticket.id]);
  return (
    <Card className='overflow-hidden'>
      <CardHeader className='bg-primary/10'>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-lg'>{ticket.eventTitle}</CardTitle>
          <Badge
            variant={
              ticket.status === 'active'
                ? 'default'
                : ticket.status === 'used'
                  ? 'secondary'
                  : 'destructive'
            }
          >
            {ticket.status === 'active'
              ? 'Active'
              : ticket.status === 'used'
                ? 'Used'
                : 'Cancelled'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className='pt-4'>
        <div className='space-y-3'>
          <div className='flex items-center text-sm'>
            <Calendar className='mr-2 h-4 w-4 text-muted-foreground' />
            <span>Purchased on {format(ticket.purchaseDate, 'PPP')}</span>
          </div>

          <div className='flex items-center text-sm'>
            <DollarSign className='mr-2 h-4 w-4 text-muted-foreground' />
            <span>Amount: ${ticket.price.toFixed(2)}</span>
          </div>

          {ticket.status === 'used' && (
            <div className='flex items-center text-sm'>
              <Ticket className='mr-2 h-4 w-4 text-muted-foreground' />
              <span>Used</span>
            </div>
          )}

          <div className='flex items-center text-sm'>
            <Barcode className='mr-2 h-4 w-4 text-muted-foreground' />
            <span>Code: {ticket.id}</span>
          </div>
        </div>
      </CardContent>

      {ticket.status === 'active' && (
        <CardFooter className='bg-muted/50 flex flex-col items-center pt-4 pb-4'>
          {showQR ? (
            <div className='bg-white p-4 rounded-lg'>
              {loading ? (
                <div className='text-sm text-muted-foreground'>Preparing secure QR...</div>
              ) : token ? (
                <QRCode value={token} size={160} level='H' includeMargin />
              ) : (
                <div className='text-sm text-red-600'>Unable to mint QR</div>
              )}
            </div>
          ) : (
            <Button onClick={onShowQR}>
              <Ticket className='mr-2 h-4 w-4' />
              Show Ticket QR
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
};

export default TicketCard;
