# Deployment Guide

## Recommended: Docker Compose

### Prerequisites

- Docker and Docker Compose on the server
- PostgreSQL database (managed service or self-hosted)
- Environment file (see below)

### Setup

1. **Copy the environment file and configure it:**

   ```bash
   cp .env.example .env
   ```

   Required variables:
   - `DATABASE_URL` — PostgreSQL connection string
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` — Google OAuth (use your production callback URL)
   - `ADMIN_EMAILS` — Comma-separated admin email addresses
   - `BASE_URL` — Public URL (e.g., `https://kulu.fyysikkokilta.fi`)
   - `JWT_SECRET` — Random secret (e.g., `openssl rand -base64 32`)
   - `STORAGE_DRIVER` — `local` or `s3`; if `s3`, set S3 endpoint, keys, and region

   Optional: mileage rate, privacy policy URL, archive age limit, file cleanup secret. See `.env.example`.

2. **Run database migrations:**

   From your host (recommended before first start):

   ```bash
   DATABASE_URL="postgresql://..." pnpm db:migrate
   ```

   Or run a one-off container that executes the migrate script, if your setup mounts the repo and has `tsx`/Node available.

3. **Start the application:**

   ```bash
   docker compose up -d
   ```

   The image is `ghcr.io/fyysikkokilta/kulumasiina-v2:latest`. The app listens on port 3000 inside the container; docker-compose maps it to `127.0.0.1:8036`. Put the app behind a reverse proxy (nginx, Caddy, Traefik) for HTTPS.

### Nginx Reverse Proxy Example

```nginx
server {
    listen 80;
    server_name kulu.example.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name kulu.example.com;

    ssl_certificate /etc/letsencrypt/live/kulu.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/kulu.example.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:8036;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Building Your Own Image

The project includes a Dockerfile (standalone Next.js output). Build with:

```bash
docker build -t my-registry/kulumasiina-v2:latest .
```

Pass build args if you need to override `NEXT_PUBLIC_*` defaults (e.g. `NEXT_PUBLIC_PRIVACY_POLICY_URL`, `NEXT_PUBLIC_MILEAGE_REIMBURSEMENT_RATE`, `NEXT_PUBLIC_ARCHIVED_ENTRIES_AGE_LIMIT_DAYS`). Then point `docker-compose.yml` at your image.

---

## Other Platforms

The app can be deployed to any platform that supports Node.js and PostgreSQL:

- **Vercel** — Use external PostgreSQL (Neon, Supabase, etc.); ensure Ghostscript is available for PDF compression or use a server that provides it.
- **Railway / Render** — Add PostgreSQL and set env vars; run migrations as a release step.
- **Traditional VPS** — Install Node.js, run `pnpm build` and `pnpm start`, use a process manager (systemd, PM2) and reverse proxy.

For all deployments:

1. Set `DATABASE_URL` and run `pnpm db:migrate` (or equivalent) after each release.
2. Configure Google OAuth with the production callback URL.
3. Set `BASE_URL` to the public URL.

---

## Database Management

### Running Migrations

```bash
pnpm db:migrate
```

Requires `DATABASE_URL` to be set.

### Creating a New Migration

After editing `src/db/schema.ts`:

```bash
pnpm db:generate
```

This creates a new SQL file in `src/drizzle/`. Commit it and run `pnpm db:migrate` to apply.

### Other Commands

```bash
pnpm db:studio   # Open Drizzle Studio (database browser)
pnpm db:push     # Push schema directly (dev only; skips migration files)
```
