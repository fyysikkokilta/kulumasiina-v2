# Customization Guide

Ways to adapt Kulumasiina to your organization with minimal code changes.

## Environment Variables

See `.env.example` for the full list. Key customization options:

| Variable                                      | Description                                            |
| --------------------------------------------- | ------------------------------------------------------ |
| `BASE_URL`                                    | Public URL of the app (used for redirects and links)   |
| `ADMIN_EMAILS`                                | Comma-separated emails that can access the admin panel |
| `NEXT_PUBLIC_PRIVACY_POLICY_URL`              | Link shown for privacy policy                          |
| `NEXT_PUBLIC_MILEAGE_REIMBURSEMENT_RATE`      | Rate per km for mileage claims                         |
| `NEXT_PUBLIC_ARCHIVED_ENTRIES_AGE_LIMIT_DAYS` | Days after which archived entries can be deleted       |

These can be set in `.env` or in your deployment environment.

## Translations

All user-facing text is in the i18n message files:

| File             | Locale  |
| ---------------- | ------- |
| `src/i18n/en.ts` | English |
| `src/i18n/fi.ts` | Finnish |

To change labels, messages, or form text, edit the corresponding keys in these files.

### Adding a New Language

1. Add a new file under `src/i18n/` (e.g. `sv.ts` for Swedish) with the same key structure as `en.ts`.
2. Register the locale in the next-intl config and routing so that routes like `/sv/` are available.

## Styling

The app uses **Tailwind CSS 4** and **Base UI** components. Global styles and theme variables are in `src/app/globals.css`. To change colors or typography, adjust the Tailwind theme or CSS variables there.

## Storage

- **Local:** Set `STORAGE_DRIVER=local`. Files are stored on the server filesystem (see `src/lib/storage.ts` for the path).
- **S3/R2:** Set `STORAGE_DRIVER=s3` and configure `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_REGION`. Use this for Cloudflare R2 or any S3-compatible storage.

## Admin Access

Admin access is controlled only by `ADMIN_EMAILS`. Any user who signs in with Google and whose email is in that list gets full admin access. There are no per-user roles; add or remove emails to change who is an admin.
