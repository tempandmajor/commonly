import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface WalletHeaderProps {
  loading: boolean;
  formattedBalance: {
    totalBalance: string;
    availableBalance: string;
    pendingBalance: string;
    platformCredit: string;
  };
  onRefresh: () => void;
  onWithdraw: () => void;
  onTransfer: () => void;
}

const WalletHeader = ({
  loading,
  formattedBalance,
  onRefresh,
  onWithdraw,
  onTransfer,
}: WalletHeaderProps) => {
  return (
    <div className='space-y-8'>
      <div>
        <h1 className='text-3xl font-bold tracking-tight'>Wallet</h1>
        <p className='text-muted-foreground'>Manage your balance and transactions</p>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        <div className='bg-gradient-to-br from-purple-500 to-indigo-600 text-white rounded-lg p-6'>
          <div className='text-sm font-medium opacity-80 mb-2'>Total Balance</div>
          <div className='text-3xl font-bold'>
            {loading ? '...' : formattedBalance.totalBalance}
          </div>
          <Button
            variant='ghost'
            size='sm'
            className='mt-4 text-white hover:text-white hover:bg-white/20'
            onClick={onRefresh}
          >
            <RefreshCw className='h-4 w-4 mr-2' />
            Refresh
          </Button>
        </div>

        <div className='rounded-lg border p-6'>
          <div className='text-sm font-medium text-muted-foreground mb-2'>Available Balance</div>
          <div className='text-3xl font-bold'>
            {loading ? '...' : formattedBalance.availableBalance}
          </div>
          <div className='flex gap-2 mt-4'>
            <Button size='sm' onClick={onWithdraw}>
              Withdraw
            </Button>
            <Button size='sm' variant='outline' onClick={onTransfer}>
              Transfer
            </Button>
          </div>
        </div>

        <div className='rounded-lg border p-6'>
          <div className='text-sm font-medium text-muted-foreground mb-2'>Pending Balance</div>
          <div className='text-3xl font-bold'>
            {loading ? '...' : formattedBalance.pendingBalance}
          </div>
          <p className='text-xs text-muted-foreground mt-2'>
            Funds being processed and will be available soon
          </p>
        </div>

        <div className='rounded-lg border p-6'>
          <div className='text-sm font-medium text-muted-foreground mb-2'>Platform Credit</div>
          <div className='text-3xl font-bold'>
            {loading ? '...' : formattedBalance.platformCredit}
          </div>
          <p className='text-xs text-muted-foreground mt-2'>
            Credit for platform features and purchases
          </p>
        </div>
      </div>
    </div>
  );
};

export default WalletHeader;
