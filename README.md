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

## Orphaned File Cleanup

This project includes an API to clean up files in storage that are not referenced in the database (orphans). This helps save storage space and keeps your storage tidy.

- It works for both local and S3 storage backends.
- Orphaned files are deleted from storage if they are not referenced in the `attachment` table in the database.

### Running the Cleanup Manually

You can trigger the orphaned file cleanup remotely via a protected API route:

- **Endpoint:** `/api/cleanup-orphaned-files` (POST)
- **Protection:** Requires a secret, set in the environment variable `FILE_CLEANUP_SECRET`.
- **How to provide the secret:**
  - As a header: `x-cleanup-secret: your_secret_here`
  - Or as a query parameter: `?secret=your_secret_here`

#### Example usage with curl

```
curl -X POST https://yourdomain.com/api/cleanup-orphaned-files -H "x-cleanup-secret: your_secret_here"
```

Or with a query parameter:

```
curl -X POST "https://yourdomain.com/api/cleanup-orphaned-files?secret=your_secret_here"
```

**Response:**
- On success: `{ success: true, deletedCount: N, deleted: [ ...fileIds ] }`
- On error: `{ error: "..." }`

**Security:**
- Only requests with the correct secret will be able to trigger the cleanup.

### Production Setup of the Cleanup Job

When running in production with Docker, the orphaned file cleanup job is scheduled and executed automatically inside the container using cron:

- The Docker image installs `curl` and `cron`.
- A crontab entry is created that triggers the protected API route `/api/cleanup-orphaned-files` at the desired schedule (default: every day at 03:00, or every minute for testing).
- The secret for the API route is injected at runtime using the `FILE_CLEANUP_SECRET` environment variable.
- The cron job runs inside the container and calls the API route via `curl`.

#### How it works
- The Dockerfile contains a line like:
  ```dockerfile
  RUN echo '0 3 * * * curl -X POST "http://localhost:3000/api/cleanup-orphaned-files?secret=$FILE_CLEANUP_SECRET"' > /etc/crontabs/root
  ```
  (For testing, you might see `* * * * *` for every minute.)
- When the container starts, both cron and the Next.js server are started together.
- The cron job will use the value of `FILE_CLEANUP_SECRET` set in your environment (e.g., in `.env` or via Docker `--env-file`).

#### How to verify
- Check your Next.js logs for cleanup activity.
- You can also check the logs of the cron job by modifying the crontab entry to append output to a file, e.g.:
  ```
  0 3 * * * curl -X POST "http://localhost:3000/api/cleanup-orphaned-files?secret=$FILE_CLEANUP_SECRET" >> /var/log/cleanup.log 2>&1
  ```
- You can trigger the cleanup manually via the API route as described above.

#### Security
- The cleanup API route is protected by the secret and is only accessible from inside the container (localhost) unless you expose it intentionally.
- Make sure to set a strong value for `FILE_CLEANUP_SECRET` in your production environment.
