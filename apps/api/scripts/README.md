# Database Scripts

This directory contains various database management and seeding scripts for the Club Corra API.

## Available Scripts

### Brand Management
- `add-dummy-brands.ts` - Add comprehensive dummy brands with categories
- `add-quick-brands.ts` - Add a few basic brands quickly
- `add-brands-direct.ts` - Add brands directly to database
- `add-brands-sql.ts` - Add brands using SQL queries
- `view-brands.ts` - View existing brands
- `check-brand-data.ts` - Check brand data structure and content
- `fix-existing-brands.ts` - Fix existing brand data issues
- `fix-existing-brands-simple.ts` - Simple brand data fixes
- `debug-brands.ts` - Debug brand-related issues

### Transaction Management
- `add-sample-transactions.ts` - Add sample earn and redeem transactions for testing
- `check-transaction-status.ts` - Check transaction status and pending requests
- `check-transaction-schema.ts` - Check the actual database schema of coin_transactions table

### Database Setup
- `setup-test-db.ts` - Setup test database
- `run-tests.ts` - Run database tests

## Usage

### Prerequisites
1. Ensure PostgreSQL is running
2. Database `club_corra_db` exists
3. User `club_corra_user` with password `club_corra_password` exists
4. Required tables are created (users, brands, coin_transactions)

### Running Scripts

#### Add Sample Transactions
```bash
# From the apps/api directory
yarn add:transactions

# Or directly with ts-node
npx ts-node scripts/add-sample-transactions.ts
```

This script will:
- Find existing active users and brands
- Generate 3-5 EARN transactions per user (mostly APPROVED status)
- Generate 2-4 REDEEM transactions per user (mixed statuses)
- Use realistic bill amounts and coin calculations
- Add sample receipt URLs and admin notes
- Insert all transactions in batches for efficiency

#### Check Transaction Status
```bash
yarn check:status
```

This script will:
- Show transaction summary by type and status
- Identify users with multiple pending requests
- Display users with multiple requests of any status
- Show recent transactions for verification
- Confirm sufficient data for testing TransactionVerificationModal

#### Check Transaction Schema
```bash
yarn check:transactions
```

This script will:
- Display the actual database schema of coin_transactions table
- Show sample data if any exists
- List enum types and their values

#### Add Dummy Brands
```bash
yarn add:brands
```

#### Check Brand Data
```bash
yarn check:brands
```

## Script Output

The transaction seeding script provides detailed output:
- Database connection status
- Number of users and brands found
- Transaction generation progress
- Batch insertion status
- Verification results with counts and averages
- Sample of created transactions

## Database Schema Requirements

The scripts expect the following tables to exist:
- `users` - User accounts
- `brands` - Brand information with earning/redemption rules
- `coin_transactions` - Transaction records
- `brand_categories` - Brand categorization

## Notes

- Scripts use the same database credentials as the main application
- All scripts include error handling and detailed logging
- Scripts are designed to be idempotent (safe to run multiple times)
- Sample data uses realistic business logic (earning percentages, redemption limits)
- Receipt URLs are placeholder URLs for testing purposes
