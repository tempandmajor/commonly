# Payment Service

This directory contains the consolidated payment service that handles all payment, wallet, and platform credit operations in the Commonly app.

## Overview

The payment service provides a unified interface for:
- Managing user wallets and balances
- Processing platform credits
- Handling Stripe payment operations
- Managing payment transactions
- Securely processing payments via Edge Functions
- React hooks for component integration

## Directory Structure

```
payment/
├── api/                 # Client-side API functions
│   ├── credit.ts        # Platform credit operations
│   ├── wallet.ts        # Wallet management
│   ├── transactions.ts  # Transaction operations
│   └── stripe.ts        # Client-side Stripe functions
├── core/                # Shared core functionality
│   ├── types.ts         # Type definitions
│   ├── constants.ts     # Constants and configuration
│   ├── errors.ts        # Error handling
│   └── client.ts        # Supabase and Stripe client
├── hooks/               # React hooks
│   └── usePayment.tsx   # Payment-related React hooks
├── edge/                # Edge function interfaces and helpers
│   ├── index.ts         # Edge function interfaces
│   └── helpers.ts       # Edge function utilities
├── utils/               # Utility functions
│   ├── formatters.ts    # Formatting utilities
│   └── validators.ts    # Validation utilities
├── compatibility/       # Backward compatibility layers
│   ├── platformCredit.ts  # Legacy platform credit API
│   └── wallet.ts        # Legacy wallet API
├── tests/               # Unit and integration tests
└── index.ts             # Main exports
```

## Usage

### Import Specific API Modules

```typescript
import { creditAPI, walletAPI, transactionsAPI, stripeAPI } from '@/services/payment';

// Example: Get user's credit balance
const balance = await creditAPI.getBalance(userId);

// Example: Create a transaction
const transaction = await transactionsAPI.createTransaction(
  userId,
  10.00,
  'credit_addition',
  'Added credits via promotion',
  { referenceId: 'promo-123' }
);
```

### Using Utility Functions

```typescript
import { formatters, validators } from '@/services/payment';

// Format an amount as currency
const formattedAmount = formatters.formatCurrency(12.50);

// Validate a credit amount
const validation = validators.validateCreditAmount(10);
if (!validation.isValid) {
  console.error(validation.error);
}
```

### Backward Compatibility

Legacy code will continue to work through backward compatibility layers:

```typescript
import { PlatformCredit } from '@/services/platformCredit';

// Old code continues to work
const balance = await PlatformCredit.getBalance(userId);
```

For explicit access to legacy APIs:

```typescript
import { LegacyPlatformCredit, LegacyWallet } from '@/services/payment';

const balance = await LegacyPlatformCredit.PlatformCredit.getBalance(userId);
```

## Security

- All sensitive operations (credit additions, payments) are handled by Edge Functions
- Client-side code only handles view operations or makes secure calls to Edge Functions
- Proper validation and error handling throughout the service

## Error Handling

The service includes standardized error handling:

```typescript
import { handlePaymentError } from '@/services/payment';

try {
  // Payment operation
} catch (error) {
  handlePaymentError(error, 'Failed to process payment');
}
```

## Database Tables

The service interacts with the following tables:
- `wallets`: Stores user wallet information and balances
- `transactions`: Records all financial transactions
- `payments`: Stores payment details
- `users`: Contains user payment profiles and Stripe customer IDs

## React Hooks

The payment service includes React hooks for easy integration in components:

### usePayment

```typescript
import { usePayment } from '@/services/payment';

function PaymentComponent() {
  const { 
    wallet, 
    paymentMethods,
    recentTransactions,
    addCredits,
    useCredits,
    createCheckoutSession,
    hasSufficientCredits
  } = usePayment();
  
  // Example: Check if user has enough credits
  const canPurchase = hasSufficientCredits(10);
  
  // Example: Use credits for a purchase
  const handlePurchase = () => {
    useCredits({
      amount: 10,
      description: 'Purchase item XYZ'
    });
  };
  
  return (
    <div>
      <p>Balance: {wallet?.balance}</p>
      {/* Component implementation */}
    </div>
  );
}
```

### useWalletBalance

Simplified hook for just displaying wallet balance:

```typescript
import { useWalletBalance } from '@/services/payment';

function BalanceDisplay() {
  const { balance, isLoading } = useWalletBalance();
  
  if (isLoading) return <p>Loading...</p>;
  
  return <p>Credits: {balance}</p>;
}
```

### useCheckout

Hook for handling Stripe checkout sessions:

```typescript
import { useCheckout } from '@/services/payment';

function CheckoutButton() {
  const { createCheckoutSession, checkoutUrl, isLoading } = useCheckout();
  
  const handleCheckout = async () => {
    await createCheckoutSession({
      amount: 20,
      description: 'Purchase credits',
      successUrl: window.location.href + '?success=true',
      cancelUrl: window.location.href
    });
  };
  
  // Redirect to checkout when URL is available
  useEffect(() => {
    if (checkoutUrl) {
      window.location.href = checkoutUrl;
    }
  }, [checkoutUrl]);
  
  return (
    <button onClick={handleCheckout} disabled={isLoading}>
      {isLoading ? 'Processing...' : 'Buy Credits'}
    </button>
  );
}
```

### useTransactionHistory

Hook for accessing transaction history:

```typescript
import { useTransactionHistory } from '@/services/payment';

function TransactionsList() {
  const { transactions, isLoading } = useTransactionHistory({ limit: 10 });
  
  if (isLoading) return <p>Loading...</p>;
  
  return (
    <ul>
      {transactions.map(tx => (
        <li key={tx.id}>
          {tx.description}: {tx.amount}
        </li>
      ))}
    </ul>
  );
}
```

## Migration Strategy

1. New features should use the consolidated API directly
2. Existing code can continue using the legacy APIs
3. Gradually migrate legacy code to use the new APIs
4. Eventually deprecate the legacy APIs once migration is complete
