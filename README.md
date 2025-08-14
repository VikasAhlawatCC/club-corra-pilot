# Club Corra Pilot

A monorepo built with Yarn workspaces and Turborepo.

## Project Structure

```
club-corra-pilot/
├── apps/
│   ├── admin/          # Next.js admin panel
│   ├── mobile/         # Expo React Native app
│   └── api/            # NestJS backend
├── packages/
│   └── shared/         # Shared types and utilities
└── docs/               # Project documentation
```

## Prerequisites

- Node.js >= 16.14.0
- Yarn >= 1.22.0

## Setup

1. **Install dependencies:**
   ```bash
   yarn install
   ```

2. **Build all packages:**
   ```bash
   yarn build
   ```

3. **Type checking:**
   ```bash
   yarn typecheck
   ```

4. **Development mode:**
   ```bash
   yarn dev
   ```

## Available Scripts

- `yarn build` - Build all packages
- `yarn dev` - Start development servers
- `yarn lint` - Run linting across all packages
- `yarn typecheck` - Run TypeScript type checking
- `yarn test` - Run tests across all packages
- `yarn clean` - Clean all build artifacts
- `yarn format` - Format code with Prettier

## Workspace Commands

- `yarn workspace @shared/shared build` - Build shared package
- `yarn workspace @shared/shared dev` - Watch shared package for changes

## Technology Stack

- **Package Manager:** Yarn (with node_modules linker)
- **Monorepo Tool:** Turborepo
- **Build Tool:** TypeScript
- **Code Quality:** Prettier, Husky, lint-staged

## Database Schema

The project uses PostgreSQL with TypeORM for database management. Key features:

- **User Management**: Authentication, profiles, payment details with mobile number support
- **Brand System**: Partner brands with earning/redemption rules and configurable limits
- **Coin System**: Transaction tracking, balance management, and business rule validation
- **Global Configuration**: System-wide settings for business rules and limits

### Recent Schema Updates

- ✅ Added mobile number support to payment details
- ✅ Consolidated brand redemption limits (removed overallMaxCap, merged maxRedemptionAmount with brandwiseMaxCap)
- ✅ Updated default values for better business logic (minRedemptionAmount: 1, maxRedemptionAmount: 2000)
- ✅ Added password and email verification columns to users table
- ✅ Enhanced authentication system with secure password management
- ✅ Added comprehensive PK and FK documentation for all tables
- ✅ Moved overall max cap to global configuration for system-wide consistency

## Development Workflow

1. Make changes in the appropriate workspace
2. Run `yarn typecheck` to ensure type safety
3. Run `yarn build` to build affected packages
4. Commit your changes

## Adding New Packages

1. Create a new directory in `apps/` or `packages/`
2. Add a `package.json` with the workspace name
3. Update the root `package.json` workspaces if needed
4. Run `yarn install` to link the new package
