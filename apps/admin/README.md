# Club Corra Admin Portal

This is the admin portal for Club Corra, built with Next.js 14, TypeScript, and Tailwind CSS.

## Features

- **Dashboard**: Overview of system metrics and recent activity
- **Brand Management**: Add, edit, and manage partner brands
- **Coin System**: Monitor coin distribution and transactions
- **User Management**: View and manage user accounts
- **Request Management**: Handle earn/redeem requests
- **Settings**: System configuration and preferences

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Custom components with shadcn/ui patterns
- **State Management**: React hooks and context
- **Authentication**: JWT-based auth (to be implemented)

## Getting Started

### Prerequisites

- Node.js 18+ 
- Yarn package manager

### Installation

1. Install dependencies from the root directory:
   ```bash
   yarn install
   ```

2. Start the development server:
   ```bash
   yarn workspace @club-corra/admin dev
   ```

3. Open [http://localhost:3001](http://localhost:3001) in your browser

### Build

```bash
yarn workspace @club-corra/admin build
```

### Production

```bash
yarn workspace @club-corra/admin start
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── brands/            # Brand management pages
│   ├── coins/             # Coin system pages
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Dashboard
├── components/             # Reusable UI components
│   └── layout/            # Layout components
└── lib/                   # Utility functions
```

## Development

### Adding New Pages

1. Create a new directory in `src/app/`
2. Add a `page.tsx` file
3. Update navigation in `AdminNavigation.tsx`

### Adding New Components

1. Create components in `src/components/`
2. Use Tailwind CSS for styling
3. Follow the existing component patterns

### Styling

- Use Tailwind CSS utility classes
- Follow the design system defined in `globals.css`
- Use the `cn()` utility for conditional classes

## Deployment

This app is designed to be deployed on Vercel with the following configuration:

- **Framework Preset**: Next.js
- **Build Command**: `yarn workspace @club-corra/admin build`
- **Output Directory**: `.next`
- **Install Command**: `yarn install`

## Environment Variables

Create a `.env.local` file with:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Club Corra Admin
```

## Contributing

1. Follow the existing code patterns
2. Use TypeScript for all new code
3. Add proper error handling
4. Test your changes thoroughly
5. Update documentation as needed
