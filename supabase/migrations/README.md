# Supabase Database Migrations

This directory contains SQL migration scripts for the CommonlyApp Supabase database schema.

## Migration Files

- `01_initial_schema.sql` - Initial database schema with all core tables for the application

## How to Apply Migrations

1. Log in to your Supabase dashboard at https://app.supabase.com
2. Select the "New Commonly" project
3. Click on the "SQL Editor" tab in the left sidebar
4. Open and execute the SQL migration files in numerical order

## Important Notes

- Always back up your database before applying migrations in production
- These migrations include Row Level Security (RLS) policies that should be reviewed and customized according to your security requirements
- After applying the schema, you may need to manually create indexes for fields that will be frequently queried

## Tables Created

- `users` - User accounts and profiles
- `events` - Event listings
- `products` - Products for sale/purchase
- `wallets` - User wallet balances
- `payments` - Payment records
- `conversations` - User conversations
- `notifications` - User notifications
- `stores` - Store profiles
- `locations` - Physical addresses and locations
- `user_locations` - User location associations
- `venues` - Event venues
- `credit_transactions` - Credit transaction records
- `ContentTest` - Content test data
- `referral_codes` - Referral code system
- `transactions` - Financial transactions

## After Migration

After applying the database schema, you should:
1. Set up appropriate Row Level Security (RLS) policies
2. Deploy your Edge Functions using the Supabase CLI
3. Update environment variables in the Supabase dashboard for your Edge Functions
