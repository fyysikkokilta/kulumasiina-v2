import { SignJWT } from 'jose'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import { Locale } from 'next-intl'

import { redirect } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'
import { env } from '@/lib/env'
import { JWT_COOKIE } from '@/utils/isAuthorized'

export async function GET(request: NextRequest) {
  const cookieStore = await cookies()
  const locale = (cookieStore.get('NEXT_LOCALE')?.value ||
    routing.defaultLocale) as Locale
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error) {
    redirect({ href: '/login?error=oauth_error', locale })
  }

  if (!code) {
    redirect({ href: '/login?error=no_code', locale })
  }

  // Exchange code for access token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      code: code || '',
      grant_type: 'authorization_code',
      redirect_uri: env.GOOGLE_REDIRECT_URI
    })
  })

  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    return new Response('Google OAuth not configured', { status: 500 })
  }

  if (!tokenResponse.ok) {
    redirect({ href: '/login?error=auth_failed', locale })
  }

  const tokenData = await tokenResponse.json()
  if (!tokenData.access_token || typeof tokenData.access_token !== 'string') {
    redirect({ href: '/login?error=auth_failed', locale })
  }

  // Get user info
  const userResponse = await fetch(
    'https://www.googleapis.com/oauth2/v2/userinfo',
    {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`
      }
    }
  )

  if (!userResponse.ok) {
    redirect({ href: '/login?error=unauthorized', locale })
  }

  const user = await userResponse.json()
  if (!user.email || typeof user.email !== 'string') {
    redirect({ href: '/login?error=auth_failed', locale })
  }

  if (!env.ADMIN_EMAILS.includes(user.email)) {
    redirect({ href: '/login?error=unauthorized', locale })
  }

  const token = await new SignJWT({ user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer('kulumasiina')
    .setExpirationTime(
      Math.floor(Date.now() / 1000) + env.JWT_EXPIRY_MINUTES * 60
    )
    .sign(new TextEncoder().encode(env.JWT_SECRET))

  cookieStore.set(JWT_COOKIE, token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: env.JWT_EXPIRY_MINUTES * 60
  })

  redirect({ href: '/admin', locale })
}
