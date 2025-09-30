# Platform Fee Structure

## Overview
The platform implements a dynamic fee structure based on Creator Program membership:
- **Regular Users**: 20% platform fee + Stripe processing fees
- **Creator Program Members**: 15% platform fee + Stripe processing fees (5% savings)

## Fee Breakdown

### Platform Fee
- **Regular Users**: 20% of transaction amount
- **Creator Program Members**: 15% of transaction amount (5% savings)
- **Applied to**: All transactions except platform fee payments themselves
- **Purpose**: Platform maintenance, development, and support

### Stripe Processing Fees
- **Rate**: 2.9% + $0.30 per transaction
- **Applied to**: All card/payment method transactions
- **Purpose**: Payment processing by Stripe

### Creator Program Benefits
- **5% Fee Reduction**: From 20% to 15% platform fee
- **Automatic Application**: Applied to all transactions for approved members
- **Eligibility**: 1,000+ total event attendees and 1,000+ followers
- **Additional Benefits**: Priority support, analytics, custom branding, early access

## Implementation

### Core Services

#### Fee Calculator (`src/services/fees/feeCalculator.ts`)
- **Dynamic fee calculation** based on Creator Program status
- **Consistent across all payment types**
- **Handles both platform and Stripe fees**
- **Creator Program benefit calculations**

#### Enhanced Payment Service (`src/services/payment/enhancedPaymentService.ts`)
- **Automatic Creator Program status checking**
- **Comprehensive payment processing with dynamic fee tracking**
- **Proper fee breakdown storage**
- **Creator earnings calculation with program benefits**

#### Fee Calculation Hook (`src/hooks/payment/useFeeCalculation.tsx`)
- **React hook for component-level fee calculations**
- **Creator Program status support**
- **Memoized calculations for performance**
- **Formatted display values with program benefits**

### Components

#### Fee Breakdown Component (`src/components/payment/FeeBreakdown.tsx`)
- **Reusable fee display component**
- **Creator Program badge and benefits display**
- **Dynamic platform fee percentage display**
- **Compact and full display modes**
- **Creator earnings display option**

### Stripe Integration

#### Stripe Connect Payments
- **Dynamic `application_fee_amount` based on Creator Program status**
- **Automatic Creator Program status checking**
- **Proper metadata tracking with program benefits**
- **Creator Program benefit tracking in payment metadata**

#### Configuration Updates
- **Updated all fee percentages to support Creator Program**
- **Consistent across all config files**
- **Dynamic fee calculation throughout the platform**

## Usage Examples

### Basic Fee Calculation (Regular User)
```typescript
import { calculateFees } from '@/services/fees/feeCalculator';

const fees = calculateFees({
  amount: 100,
  isPlatformFee: false,
  includeStripeFees: true,
  isCreatorProgram: false
});

// Result:
// {
//   subtotal: 100,
//   platformFee: 20.00,
//   platformFeePercentage: 20,
//   stripeFee: 3.20,
//   totalFees: 23.20,
//   total: 123.20,
//   netToCreator: 80.00,
//   isCreatorProgram: false
// }
```

### Creator Program Member Fee Calculation
```typescript
const creatorFees = calculateFees({
  amount: 100,
  isPlatformFee: false,
  includeStripeFees: true,
  isCreatorProgram: true
});

// Result:
// {
//   subtotal: 100,
//   platformFee: 15.00,
//   platformFeePercentage: 15,
//   stripeFee: 3.20,
//   totalFees: 18.20,
//   total: 118.20,
//   netToCreator: 85.00,
//   isCreatorProgram: true
// }
```

### Using the Hook with Creator Program
```typescript
const { feeBreakdown, creatorProgramBenefit } = useFeeCalculation({
  amount: 100,
  isCreatorProgram: false // Will show potential savings
});

// creatorProgramBenefit:
// {
//   savings: 5.00,
//   savingsPercentage: 5.0,
//   creatorEarnings: 85.00,
//   regularEarnings: 80.00
// }
```

### Creator Program Benefit Comparison
```typescript
import { getCreatorProgramBenefit } from '@/services/fees/feeCalculator';

const benefit = getCreatorProgramBenefit(1000);

// Result:
// {
//   regularEarnings: 800.00,
//   creatorEarnings: 850.00,
//   savings: 50.00,
//   savingsPercentage: 5.0,
//   additionalEarningsPercentage: 5.0
// }
```

## Revenue Impact Examples

### Monthly Revenue Scenarios

#### $1,000 Monthly Revenue
- **Regular User**: $800 earnings (20% fee = $200)
- **Creator Program**: $850 earnings (15% fee = $150)
- **Monthly Savings**: $50 (6.25% more income)
- **Annual Savings**: $600

#### $5,000 Monthly Revenue
- **Regular User**: $4,000 earnings (20% fee = $1,000)
- **Creator Program**: $4,250 earnings (15% fee = $750)
- **Monthly Savings**: $250 (6.25% more income)
- **Annual Savings**: $3,000

#### $10,000 Monthly Revenue
- **Regular User**: $8,000 earnings (20% fee = $2,000)
- **Creator Program**: $8,500 earnings (15% fee = $1,500)
- **Monthly Savings**: $500 (6.25% more income)
- **Annual Savings**: $6,000

## Migration Notes

### Updated Components
- All payment-related components now support Creator Program status
- Fee displays automatically show correct percentages
- Creator Program benefits are highlighted for non-members

### Database Integration
- Automatic Creator Program status checking for all payments
- Payment metadata includes Creator Program information
- Fee calculations stored with program status

### Backward Compatibility
- All existing payment flows continue to work
- Non-Creator Program members see standard 20% fees
- Creator Program members automatically get reduced fees

---

**Note:** This fee structure provides significant value to creators while maintaining platform sustainability. The 5% reduction for Creator Program members represents a meaningful incentive for high-performing creators to join the program.

## Testing

### Fee Calculation Tests
```typescript
import { calculateFees, validateFeeCalculation } from '@/services/fees/feeCalculator';

// Test basic calculation
const fees = calculateFees({ amount: 100 });
expect(fees.platformFee).toBe(5.00);
expect(fees.stripeFee).toBe(3.20);
expect(validateFeeCalculation(fees)).toBe(true);
```

### Component Tests
- Fee display accuracy
- Proper formatting
- Creator earnings calculation

## Monitoring

### Key Metrics
- Total platform fees collected
- Average transaction size
- Creator earnings distribution
- Fee calculation accuracy

### Alerts
- Fee calculation errors
- Stripe fee discrepancies
- Platform fee collection failures

## Support

### Customer Inquiries
- Clear fee breakdown in receipts
- Transparent fee structure documentation
- Creator earnings explanations

### Creator Support
- Earnings calculation tools
- Fee optimization suggestions
- Volume discount information 