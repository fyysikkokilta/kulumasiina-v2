import { jwtVerify } from 'jose'

import { env } from '@/lib/env'

export const JWT_COOKIE = 'admin_token'

export interface User {
  email: string
  name?: string
}

export default async function isAuthorized(token?: string) {
  if (!token) {
    return false
  }

  try {
    const secret = new TextEncoder().encode(env.JWT_SECRET)

    const { payload } = await jwtVerify(token, secret, {
      algorithms: ['HS256'],
      issuer: 'kulumasiina'
    })

    if (!payload || typeof payload !== 'object' || !('user' in payload)) {
      return false
    }

    const user = payload.user as User

    // Allow test email in test and development environments for testing
    if (
      (env.NODE_ENV === 'test' || env.NODE_ENV === 'development') &&
      user.email === 'test@email.com'
    ) {
      return true
    }

    return env.ADMIN_EMAILS.includes(user.email)
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('JWT verification failed:', error)
    }
    return false
  }
}
