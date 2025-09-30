import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PaymentsTabContent from './payments/PaymentsTabContent';
import PlatformCredit from './payments/PlatformCredit';
import { usePaymentSettings } from '@/hooks/usePaymentSettings';

interface PaymentsTabProps {
  returnTo?: string | undefined| null;
}

const PaymentsTab = ({ returnTo }: PaymentsTabProps) => {
  const {
    loading,
    platformCredit,
    transactions,
    customAmount,
    setCustomAmount,
    processingCredit,
    addCredit,
  } = usePaymentSettings();

  // Function to handle adding credit
  const handleAddCredit = (amount: number | string) => {
    addCredit(amount);
  };

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-bold tracking-tight'>Payment Methods</h1>
        <p className='text-muted-foreground'>Manage your payment methods and platform credit</p>
      </div>

      <Tabs defaultValue='methods'>
        <TabsList>
          <TabsTrigger value='methods'>Payment Methods</TabsTrigger>
          <TabsTrigger value='credit'>Platform Credit</TabsTrigger>
        </TabsList>
        <TabsContent value='methods' className='space-y-4'>
          <PaymentsTabContent returnTo={returnTo} />
        </TabsContent>
        <TabsContent value='credit' className='space-y-4'>
          <PlatformCredit
            platformCredit={platformCredit}
            transactions={transactions}
            customAmount={customAmount}
            processingCredit={processingCredit}
            onCustomAmountChange={setCustomAmount}
            onAddCredit={handleAddCredit}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PaymentsTab;
