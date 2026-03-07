# OAuth Setup Guide

Kulumasiina uses **Google OAuth 2.0** for admin authentication.

## Google OAuth

### Setup Steps

1. Go to the [Google Cloud Console](https://console.cloud.google.com/) and create or select a project.

2. Open **APIs & Services → OAuth consent screen**.
   - Choose **External** (or Internal if using Google Workspace)
   - Fill in app name, user support email, and developer contact
   - Add scopes: `email`, `profile`, `openid`

3. Open **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
   - Application type: **Web application**
   - Add **Authorized redirect URI:** `https://your-domain.com/api/auth/google/callback`
   - For local dev also add: `http://localhost:3000/api/auth/google/callback`

4. Copy the **Client ID** and **Client Secret**.

### Environment Variables

```env
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_REDIRECT_URI="https://your-domain.com/api/auth/google/callback"
```

For local development:

```env
GOOGLE_REDIRECT_URI="http://localhost:3000/api/auth/google/callback"
```

---

## Admin Access Control

Authentication only verifies identity. Admin access is controlled by the `ADMIN_EMAILS` variable:

```env
ADMIN_EMAILS="admin@example.com,treasurer@example.com"
```

Only users whose authenticated Google email is in this list can access the admin panel.

---

## Callback URL

The callback URL pattern is:

```
https://your-domain.com/api/auth/google/callback
```

Use your actual `BASE_URL` (or origin) as the base. The redirect URI configured in Google must match exactly (including trailing slash or not, per Google’s configuration).
