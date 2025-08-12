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
