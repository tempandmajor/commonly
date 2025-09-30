# Creator Earnings System

This module provides comprehensive earnings tracking and analytics for creators on the Commonly platform.

## Overview

The earnings system aggregates revenue from multiple sources and provides detailed analytics for creators to track their income, fees, and payout schedules.

## Features

- **Multi-source earnings tracking**: Event tickets, product sales, community subscriptions
- **Real-time database integration**: Connects to actual order, payment, and wallet data
- **Platform fee calculations**: Automatic calculation of Stripe fees and platform commissions
- **Monthly trend analysis**: Compare current vs previous month performance
- **Payout management**: Track available balance and pending payouts
- **Detailed breakdowns**: See earnings by source with percentages

## Data Sources

### 1. Event Ticket Sales
- Pulls from `event_registrations` table for completed ticket purchases
- Cross-references with `payments` table for direct payment records
- Calculates Stripe processing fees (2.9% + $0.30)

### 2. Product Sales
- Queries `orders` table for confirmed product purchases
- Links to `products` table to get creator ownership
- Applies standard processing fees

### 3. Community Subscriptions
- Fetches from `wallet_transactions` with reference type 'community_subscription'
- Applies 10% platform fee for subscription revenue

### 4. Wallet Integration
- Connects to `wallets` table for balance information
- Tracks available and pending payout amounts
- Supports real-time balance updates

## Key Components

### `earningsTracker.ts`
Main service file containing:
- `fetchCreatorEarnings()`: Aggregates all earnings sources
- `getPayoutSchedule()`: Calculates next payout dates
- Source-specific functions for events, products, subscriptions

### `CreatorEarnings.tsx`
React component providing:
- Visual earnings dashboard
- Stripe Connect integration
- Real-time data loading with error handling
- Monthly comparison charts

## Usage

```typescript
import { fetchCreatorEarnings, getPayoutSchedule } from '@/services/earnings/earningsTracker';

// Fetch earnings for last 90 days
const earnings = await fetchCreatorEarnings(creatorId, {
  startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
  endDate: new Date()
});

// Get payout information
const payout = await getPayoutSchedule(creatorId);
```

## Error Handling

The system implements graceful error handling:
- Falls back to default values if database queries fail
- Logs detailed error information for debugging
- Continues operation with reduced functionality
- Shows user-friendly error messages

## Fee Structure

### Event Tickets
- Stripe processing: 2.9% + $0.30 per transaction
- Platform fee: Included in processing fees

### Product Sales
- Stripe processing: 2.9% + $0.30 per transaction
- Platform fee: Included in processing fees

### Community Subscriptions
- Platform fee: 10% of subscription amount
- Payment processing: Handled separately

## Payout Schedule

- **Frequency**: Weekly (Fridays)
- **Minimum**: $25.00
- **Processing**: 2-3 business days
- **Method**: Stripe Connect direct deposit

## Development Notes

### Database Dependencies
Requires the following tables:
- `events`, `event_registrations`
- `products`, `orders`
- `wallet_transactions`, `wallets`
- `payments`, `users`

### Environment Variables
- Stripe configuration via environment
- Database connection through Supabase client

### Testing
Test with sample data in development:
```sql
-- Create test event
INSERT INTO events (creator_id, title, price) VALUES ('user-id', 'Test Event', 50.00);

-- Create test registration
INSERT INTO event_registrations (event_id, user_id, payment_status) VALUES ('event-id', 'buyer-id', 'completed');
```

## Future Enhancements

- [ ] Sponsorship revenue tracking
- [ ] Tax document generation
- [ ] International payout support
- [ ] Revenue forecasting
- [ ] Advanced analytics dashboard 