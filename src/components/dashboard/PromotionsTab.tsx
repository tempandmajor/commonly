import PromotionDashboard from '@/components/promotions/PromotionDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Wallet, BadgeDollarSign, Gift, Clock } from 'lucide-react';

import { usePromotionalCredits } from '@/hooks/usePromotionalCredits';
import { Skeleton } from '@/components/ui/skeleton';
import { stringToDate, formatDate } from '@/lib/utils';

const PromotionsTab = () => {
  const { credits, loading } = usePromotionalCredits();

  // Calculate totals for credit display
  const availableCredits = credits
    .filter(credit => credit.status === 'active')
    .reduce((sum, credit) => sum + credit.remainingAmount, 0);

  const totalReceivedCredits = credits.reduce((sum, credit) => sum + credit.amount, 0);

  // Find next expiring credit
  const nextExpiryCredit = credits
    .filter(credit => credit.status === 'active' && credit.remainingAmount > 0)
    .sort((a, b) => {
      const dateA = stringToDate(a.expiresAt);
      const dateB = stringToDate(b.expiresAt);
      return dateA.getTime() - dateB.getTime();
    })[0];

  const nextExpiryDate = nextExpiryCredit
    ? formatDate(stringToDate(nextExpiryCredit.expiresAt))
    : 'No expiry';

  return (
    <div className='space-y-6'>
      {/* Credits Summary Card */}
      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='text-lg font-bold flex items-center'>
            <BadgeDollarSign className='h-5 w-5 mr-2 text-primary' />
            Available Promotional Credits
          </CardTitle>
          <CardDescription>
            Credits can be used to promote your content without additional payment
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
              <Skeleton className='h-24 w-full' />
              <Skeleton className='h-24 w-full' />
              <Skeleton className='h-24 w-full' />
            </div>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
              <div className='flex items-center p-4 bg-muted/50 rounded-lg'>
                <Wallet className='h-10 w-10 text-primary mr-4' />
                <div>
                  <p className='text-sm text-muted-foreground'>Total Available</p>
                  <p className='text-2xl font-bold'>${availableCredits.toFixed(2)}</p>
                </div>
              </div>

              <div className='flex items-center p-4 bg-muted/50 rounded-lg'>
                <Gift className='h-10 w-10 text-primary mr-4' />
                <div>
                  <p className='text-sm text-muted-foreground'>Credits Received</p>
                  <p className='text-2xl font-bold'>${totalReceivedCredits.toFixed(2)}</p>
                </div>
              </div>

              <div className='flex items-center p-4 bg-muted/50 rounded-lg'>
                <Clock className='h-10 w-10 text-primary mr-4' />
                <div>
                  <p className='text-sm text-muted-foreground'>Next Expiry</p>
                  <p className='text-lg font-bold'>{nextExpiryDate}</p>
                </div>
              </div>
            </div>
          )}

          <Tabs defaultValue='active'>
            <TabsList className='mb-4'>
              <TabsTrigger value='active'>Active Credits</TabsTrigger>
              <TabsTrigger value='used'>Used Credits</TabsTrigger>
            </TabsList>

            <TabsContent value='active'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Amount</TableHead>
                    <TableHead>Remaining</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Received</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <Skeleton className='h-12 w-full' />
                      </TableCell>
                    </TableRow>
                  ) : (
                    <>
                      {credits
                        .filter(credit => credit.status === 'active')
                        .map(credit => (
                          <TableRow key={credit.id}>
                            <TableCell>${credit.amount.toFixed(2)}</TableCell>
                            <TableCell>${credit.remainingAmount.toFixed(2)}</TableCell>
                            <TableCell>{credit.reason}</TableCell>
                            <TableCell>{formatDate(stringToDate(credit.createdAt))}</TableCell>
                            <TableCell>{formatDate(stringToDate(credit.expiresAt))}</TableCell>
                            <TableCell>
                              <Badge className='bg-black text-white'>Active</Badge>
                            </TableCell>
                          </TableRow>
                        ))}

                      {credits.filter(credit => credit.status === 'active').length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className='text-center py-4 text-muted-foreground'>
                            No active promotional credits
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  )}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value='used'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Amount</TableHead>
                    <TableHead>Used</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Received</TableHead>
                    <TableHead>Expired</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <Skeleton className='h-12 w-full' />
                      </TableCell>
                    </TableRow>
                  ) : (
                    <>
                      {credits
                        .filter(credit => credit.status !== 'active')
                        .map(credit => (
                          <TableRow key={credit.id}>
                            <TableCell>${credit.amount.toFixed(2)}</TableCell>
                            <TableCell>
                              ${(credit.amount - credit.remainingAmount).toFixed(2)}
                            </TableCell>
                            <TableCell>{credit.reason}</TableCell>
                            <TableCell>{formatDate(stringToDate(credit.createdAt))}</TableCell>
                            <TableCell>{formatDate(stringToDate(credit.expiresAt))}</TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  credit.status === 'expired'
                                    ? 'secondary'
                                    : credit.status === 'depleted'
                                      ? 'outline'
                                      : 'destructive'
                                }
                              >
                                {credit.status.charAt(0).toUpperCase() + credit.status.slice(1)}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}

                      {credits.filter(credit => credit.status !== 'active').length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className='text-center py-4 text-muted-foreground'>
                            No used or expired promotional credits
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  )}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>

          <div className='mt-4 p-4 bg-muted/30 rounded-lg text-sm'>
            <p className='text-muted-foreground'>
              When creating a promotion, you can choose to use your promotional credits instead of
              making a direct payment. Credits are automatically applied in order of expiration date
              (soonest first).
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Promotion Dashboard */}
      <PromotionDashboard />
    </div>
  );
};

export default PromotionsTab;
