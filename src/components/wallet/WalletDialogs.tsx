import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { PaymentMethod } from '@/lib/types';

interface WalletDialogsProps {
  formattedBalance: {
    availableBalance: string;
  };
  withdrawOpen: boolean;
  setWithdrawOpen: React.Dispatch<React.SetStateAction<boolean>>;
  withdrawAmount: string;
  setWithdrawAmount: React.Dispatch<React.SetStateAction<string>>;
  selectedPaymentMethod: string;
  setSelectedPaymentMethod: React.Dispatch<React.SetStateAction<string>>;
  paymentMethods: PaymentMethod[];
  handleWithdraw: () => Promise<void>;
  transferOpen: boolean;
  setTransferOpen: React.Dispatch<React.SetStateAction<boolean>>;
  transferAmount: string;
  setTransferAmount: React.Dispatch<React.SetStateAction<string>>;
  transferUserId: string;
  setTransferUserId: React.Dispatch<React.SetStateAction<string>>;
  transferDescription: string;
  setTransferDescription: React.Dispatch<React.SetStateAction<string>>;
  handleTransferToUser: () => Promise<void>;
  addPaymentMethodOpen: boolean;
  setAddPaymentMethodOpen: React.Dispatch<React.SetStateAction<boolean>>;
  bankName: string;
  setBankName: React.Dispatch<React.SetStateAction<string>>;
  accountNumber: string;
  setAccountNumber: React.Dispatch<React.SetStateAction<string>>;
  handleAddBankAccount: () => Promise<void>;
  addFundsOpen?: boolean;
  setAddFundsOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  addFundsAmount?: string;
  setAddFundsAmount?: React.Dispatch<React.SetStateAction<string>>;
  handleAddFunds?: () => Promise<void>;
}

const WalletDialogs: React.FC<WalletDialogsProps> = ({
  formattedBalance,
  withdrawOpen,
  setWithdrawOpen,
  withdrawAmount,
  setWithdrawAmount,
  selectedPaymentMethod,
  setSelectedPaymentMethod,
  paymentMethods,
  handleWithdraw,
  transferOpen,
  setTransferOpen,
  transferAmount,
  setTransferAmount,
  transferUserId,
  setTransferUserId,
  transferDescription,
  setTransferDescription,
  handleTransferToUser,
  addPaymentMethodOpen,
  setAddPaymentMethodOpen,
  bankName,
  setBankName,
  accountNumber,
  setAccountNumber,
  handleAddBankAccount,
  addFundsOpen,
  setAddFundsOpen,
  addFundsAmount,
  setAddFundsAmount,
  handleAddFunds,
}) => {
  return (
    <>
      {/* Add Funds Dialog */}
      {addFundsOpen && setAddFundsOpen && addFundsAmount && setAddFundsAmount && handleAddFunds && (
        <Dialog open={addFundsOpen} onOpenChange={setAddFundsOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Funds to Wallet</DialogTitle>
              <DialogDescription>
                Add funds to your wallet to make purchases and transfers. Your current balance:{' '}
                {formattedBalance.availableBalance}
              </DialogDescription>
            </DialogHeader>
            <div className='grid gap-4 py-4'>
              <div className='grid gap-2'>
                <Label htmlFor='add-amount'>Amount to Add ($)</Label>
                <Input
                  id='add-amount'
                  type='number'
                  value={addFundsAmount}
                  onChange={e => setAddFundsAmount((e.target as HTMLInputElement).value)}
                  placeholder='0.00'
                  min='1.00'
                  step='0.01'
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant='outline' onClick={() => setAddFundsOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddFunds}>Add Funds</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Withdraw Dialog */}
      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Withdraw Funds</DialogTitle>
            <DialogDescription>
              Your available balance: {formattedBalance.availableBalance}
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='grid gap-2'>
              <Label htmlFor='amount'>Amount</Label>
              <Input
                id='amount'
                type='number'
                value={withdrawAmount}
                onChange={e => setWithdrawAmount((e.target as HTMLInputElement).value)}
                placeholder='0.00'
                min='0.01'
                step='0.01'
              />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='payment-method'>Payment Method</Label>
              <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder='Select a payment method' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=''>Default payment method</SelectItem>
                  {paymentMethods.map(method => (
                    <SelectItem key={method.id} value={method.id}>
                      {method.card ? (
                        <>
                          {method.card.brand} •••• {method.card.last4}
                        </>
                      ) : (
                        <>{method.type} Payment Method</>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setWithdrawOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleWithdraw}>Withdraw</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer Funds</DialogTitle>
            <DialogDescription>
              Your available balance: {formattedBalance.availableBalance}
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='grid gap-2'>
              <Label htmlFor='recipient'>Recipient User ID</Label>
              <Input
                id='recipient'
                value={transferUserId}
                onChange={e => setTransferUserId((e.target as HTMLInputElement).value)}
                placeholder='Enter user ID'
              />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='transfer-amount'>Amount</Label>
              <Input
                id='transfer-amount'
                type='number'
                value={transferAmount}
                onChange={e => setTransferAmount((e.target as HTMLInputElement).value)}
                placeholder='0.00'
                min='0.01'
                step='0.01'
              />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='description'>Description (optional)</Label>
              <Textarea
                id='description'
                value={transferDescription}
                onChange={e => setTransferDescription((e.target as HTMLInputElement).value)}
                placeholder='Enter a description for this transfer'
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setTransferOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleTransferToUser}>Transfer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Bank Account via Stripe Connect Dialog */}
      <Dialog open={addPaymentMethodOpen} onOpenChange={setAddPaymentMethodOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Bank Account</DialogTitle>
            <DialogDescription>
              Manage your bank account and withdrawals through your secure Stripe Connect dashboard
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
              <div className='flex items-start gap-3'>
                <div className='bg-blue-100 rounded-full p-2'>
                  <svg
                    className='h-5 w-5 text-blue-600'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
                    />
                  </svg>
                </div>
                <div className='flex-1'>
                  <h3 className='text-sm font-medium text-blue-900'>
                    Secure Bank Account Management
                  </h3>
                  <p className='text-sm text-blue-700 mt-1'>
                    For your security, all bank account information and withdrawals are managed
                    through your personal Stripe Connect dashboard. This ensures your financial data
                    is protected with bank-level security.
                  </p>
                </div>
              </div>
            </div>

            <div className='space-y-3'>
              <h4 className='text-sm font-medium'>What you can do in Stripe Connect:</h4>
              <ul className='text-sm text-muted-foreground space-y-1'>
                <li>• Add and verify bank accounts</li>
                <li>• Set up automatic payouts</li>
                <li>• View payout history and status</li>
                <li>• Update tax information</li>
                <li>• Manage account settings</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setAddPaymentMethodOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddBankAccount} className='bg-blue-600 hover:bg-blue-700'>
              Open Stripe Connect Dashboard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default WalletDialogs;
