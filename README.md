# Kulumasiina v2 - Next.js 15 with Drizzle ORM

A modern expense management system built with Next.js 15, featuring server-side rendering, server actions, Drizzle ORM, and Tailwind CSS.

## Features

- **Next.js 15** with App Router
- **Drizzle ORM** with PostgreSQL database
- **Server Actions** using next-safe-action for all mutating operations
- **Server Components** for data fetching
- **Tailwind CSS** for styling (with Ant Design components)
- **TypeScript** for type safety
- **Internationalization** (Finnish/English)
- **Google OAuth** authentication
- **Session-based authentication** with secure cookies

## Pages

- `/` - Expense form for submitting new expense claims
- `/login` - Login page with Google OAuth
- `/admin` - Admin panel for managing expense entries (requires authentication)

## Architecture

### Database

- **PostgreSQL** database with Drizzle ORM
- **Migrations** handled with Drizzle Kit
- **Type-safe** database queries
- **Relations** between entries, items, mileages, and attachments

### Server Actions

All mutating operations are handled by server actions:

- `createEntryAction` - Submit new expense entries
- `approveEntriesAction` - Approve expense entries
- `denyEntriesAction` - Deny expense entries
- `payEntriesAction` - Mark entries as paid
- `archiveEntriesAction` - Archive entries
- `resetEntriesAction` - Reset entry status

### Authentication

- **Google OAuth** integration
- **Session-based** authentication with secure cookies
- **Admin roles** based on environment variables
- **Protected routes** for admin functionality

### Styling

- **Tailwind CSS** for utility-first styling
- **Ant Design** components for UI elements
- **Responsive** design with mobile support

## Development

### Prerequisites

1. **PostgreSQL** database (local or cloud-hosted)
   - Local: Install PostgreSQL and create a database
   - Cloud: Use services like [Neon](https://neon.tech/), [Supabase](https://supabase.com/), or [Railway](https://railway.app/)
2. **Ghostscript** (required for PDF compression)
   - Install Ghostscript and ensure it is available in your system PATH.
   - [Instructions](https://github.com/victorsoares96/compress-pdf)
   - This is required for PDF compression to work (used by the `compress-pdf` library).

### Setup

```bash
# Install dependencies
npm install

# Copy environment file and configure
cp .env.example .env.local

# Generate database migrations
npm run db:generate

# Push migrations to database
npm run db:push

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Open Drizzle Studio (database GUI)
npm run db:studio
```

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

```bash
# Database Configuration (PostgreSQL)
DATABASE_URL=postgresql://username:password@localhost:5432/kulumasiina

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# Admin Configuration (comma-separated emails)
ADMIN_EMAILS=admin@example.com,another-admin@example.com

# Mileage Configuration
MILEAGE_REIMBURSEMENT_RATE=0.25
MILEAGE_PROCOUNTOR_PRODUCT_ID=v2025_kmkorv

# JWT Configuration
JWT_SECRET=your_long_random_jwt_secret_here
JWT_EXPIRY_MINUTES=180

# Privacy Policy
PRIVACY_POLICY_URL=https://fyysikkokilta.fi/tietosuoja
```

## Database Schema

The application uses the following main tables:

- **entries** - Main expense claims
- **items** - Individual expense items
- **mileages** - Mileage claims
- **attachments** - File attachments for items

All tables include proper PostgreSQL types with `serial` primary keys, `timestamp` columns, and `numeric` types for financial data.

## Migration from Python Backend

This project has been completely transformed:

### Key Changes:

1. **Backend**: FastAPI Python → Next.js 15 Server Actions
2. **Database**: Python SQLAlchemy → Drizzle ORM with PostgreSQL
3. **Authentication**: JWT tokens → Session-based with cookies
4. **API**: REST endpoints → Server Actions
5. **Routing**: React Router → Next.js App Router
6. **State Management**: Redux → Server state + React state
7. **Styling**: CSS → Tailwind CSS (with Ant Design)

### Preserved Features:

- All expense management functionality
- Admin panel with entry management
- Google OAuth authentication
- Ant Design components
- Internationalization (Finnish/English)
- TypeScript type safety
- File upload and attachment handling

## Deployment

The application can be deployed to any platform that supports Next.js and PostgreSQL:

- **Vercel** with external PostgreSQL (Neon, Supabase, etc.)
- **Railway** with built-in PostgreSQL
- **Render** with PostgreSQL add-on
- **Docker** with PostgreSQL container
- **Traditional hosting** with Node.js and PostgreSQL

### Database Setup for Production

1. Create a PostgreSQL database
2. Set the `DATABASE_URL` environment variable
3. Run migrations with `npm run db:push`

## Development Notes

- Database migrations must be run manually with `npm run db:push`
- Admin users are determined by the `ADMIN_EMAILS` environment variable
- The application requires a PostgreSQL connection
- All data is stored in the configured PostgreSQL database

## Dev setup

1. Install Node.js and npm
2. Set up PostgreSQL database (local or cloud)
3. Copy `.env.example` to `.env.local` and configure
4. Run `npm install`
5. Run `npm run db:push` to set up database
6. Run `npm run dev`
