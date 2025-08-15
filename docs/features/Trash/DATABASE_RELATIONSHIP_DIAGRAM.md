# Database Relationship Diagram

## Table Relationships with PK/FK Tags

```
users (PK: id)
├── user_profiles (PK: id, FK: userId → users.id)
├── payment_details (PK: id, FK: userId → users.id)
├── auth_providers (PK: id, FK: userId → users.id)
├── coin_balances (PK: id, FK: userId → users.id)
└── coin_transactions (PK: id, FK: userId → users.id)

brand_categories (PK: id)
└── brands (PK: id, FK: categoryId → brand_categories.id)
    └── coin_transactions (PK: id, FK: brandId → brands.id)

otps (PK: id) - Standalone table
global_config (PK: id) - Standalone table
```

## Key Relationships

- **Users** is the central table with 1:1 relationships to profiles, payment details, and coin balances
- **Users** has 1:many relationships to auth providers and coin transactions
- **Brand Categories** has 1:many relationship to brands
- **Brands** has 1:many relationship to coin transactions
- **OTPs** and **Global Config** are standalone tables

## Foreign Key Rules

- **CASCADE DELETE**: user_profiles, payment_details, auth_providers, coin_balances, coin_transactions
- **RESTRICT DELETE**: brands (prevents deletion if brands have transactions)
- **SET NULL DELETE**: coin_transactions.brandId (sets to null if brand is deleted)
