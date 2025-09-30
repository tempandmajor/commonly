import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Transaction, ReferralStats } from '@/services/wallet/types';
import { Copy, Users, UserPlus, Share2, RefreshCcw } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';
import { TransactionStatusBadge } from './components/transactions/TransactionStatusBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/utils/currency';

interface ReferralTabProps {
  currentUrl: string;
  referralCode: string | null;
  referralStats: ReferralStats | null;
  referralTxs: Transaction[];
  onCopyReferralCode: () => void;
}

const ReferralTab: React.FC<ReferralTabProps> = ({
  currentUrl,
  referralCode,
  referralStats,
  referralTxs,
  onCopyReferralCode,
}) => {
  const [showShareDialog, setShowShareDialog] = useState(false);

  const referralUrl = `${currentUrl}?ref=${referralCode}`;

  if (!referralCode || !referralStats) {
    return <Skeleton className='w-full h-64' />;
  }

  return (
    <div className='space-y-6'>
      <div className='grid gap-4 md:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardTitle className='text-xl font-bold flex items-center'>
              <UserPlus className='mr-2 h-5 w-5' />
              Your Referral Code
            </CardTitle>
            <CardDescription>Share this code to earn rewards</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='flex space-x-2'>
              <Input value={referralCode} readOnly className='font-mono bg-muted' />
              <Button variant='outline' size='icon' onClick={onCopyReferralCode}>
                <Copy className='h-4 w-4' />
              </Button>
            </div>

            <Button
              variant='outline'
              className='w-full mt-4'
              onClick={() => setShowShareDialog(!showShareDialog)}
            >
              <Share2 className='mr-2 h-4 w-4' />
              Share Referral Link
            </Button>

            {showShareDialog && (
              <div className='mt-4 p-4 border rounded-md bg-muted'>
                <p className='text-sm mb-2'>Share this URL:</p>
                <div className='flex space-x-2'>
                  <Input value={referralUrl} readOnly className='font-mono text-xs' />
                  <Button
                    variant='outline'
                    size='icon'
                    onClick={() => {
                      navigator.clipboard.writeText(referralUrl);
                      onCopyReferralCode();
                    }}
                  >
                    <Copy className='h-4 w-4' />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='text-xl font-bold flex items-center'>
              <Users className='mr-2 h-5 w-5' />
              Referral Stats
            </CardTitle>
            <CardDescription>Your referral performance</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div>
              <div className='flex justify-between mb-1'>
                <span className='text-sm font-medium'>Conversion Rate</span>
                <span className='text-sm font-medium'>
                  {(referralStats.conversionRate * 100).toFixed(1)}%
                </span>
              </div>
              <Progress value={referralStats.conversionRate * 100} className='h-2' />
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <div>
                <p className='text-sm text-muted-foreground'>Total Referrals</p>
                <p className='text-2xl font-bold'>{referralStats.totalReferrals}</p>
              </div>
              <div>
                <p className='text-sm text-muted-foreground'>Active Referrals</p>
                <p className='text-2xl font-bold'>{referralStats.activeReferrals}</p>
              </div>
              <div>
                <p className='text-sm text-muted-foreground'>Pending Referrals</p>
                <p className='text-2xl font-bold'>{referralStats.pendingReferrals}</p>
              </div>
              <div>
                <p className='text-sm text-muted-foreground'>Total Earnings</p>
                <p className='text-2xl font-bold text-green-600'>
                  {formatCurrency(referralStats.totalEarnings)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center'>
            <RefreshCcw className='mr-2 h-5 w-5' />
            Referral Transactions
          </CardTitle>
          <CardDescription>Your referral earning history</CardDescription>
        </CardHeader>
        <CardContent>
          {referralTxs.length === 0 ? (
            <div className='text-center py-6 text-muted-foreground'>
              No referral earnings found yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {referralTxs.map(tx => (
                  <TableRow key={tx.id}>
                    <TableCell>
                      {typeof tx.createdAt === 'string'
                        ? format(new Date(tx.createdAt), 'MMM dd, yyyy')
                        : format(tx.createdAt, 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>{tx.description}</TableCell>
                    <TableCell className='text-green-600'>+{formatCurrency(tx.amount)}</TableCell>
                    <TableCell>
                      <TransactionStatusBadge status={tx.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReferralTab;
