import { env } from '@/lib/env'

export function GET() {
  if (!env.GOOGLE_CLIENT_ID) {
    return new Response('Google OAuth not configured', { status: 500 })
  }

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  authUrl.searchParams.set('client_id', env.GOOGLE_CLIENT_ID)
  authUrl.searchParams.set('redirect_uri', env.GOOGLE_REDIRECT_URI)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope', 'openid profile email')

  return Response.redirect(authUrl.toString())
}
