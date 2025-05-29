import { redirect } from 'next/navigation'
import { NextRequest } from 'next/server'

import { createJWTToken, createUser } from '@/lib/auth'
import { env } from '@/lib/env'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code') || ''
  const error = searchParams.get('error')

  if (error) {
    redirect('/login?error=oauth_error')
  }

  if (!code) {
    redirect('/login?error=no_code')
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
      code,
      grant_type: 'authorization_code',
      redirect_uri: env.GOOGLE_REDIRECT_URI
    })
  })

  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    return new Response('Google OAuth not configured', { status: 500 })
  }

  const tokenData = (await tokenResponse.json()) as { access_token: string }

  if (!tokenResponse.ok) {
    redirect(`/login?error=auth_failed`)
  }

  // Get user info
  const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`
    }
  })

  if (!userResponse.ok) {
    redirect('/login?error=auth_failed')
  }

  const userData = (await userResponse.json()) as { email: string; name: string }

  const user = createUser(userData.email, userData.name)
  await createJWTToken(user)
  redirect('/admin')
}
