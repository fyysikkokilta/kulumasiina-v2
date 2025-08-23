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
    const JWT_SECRET = new TextEncoder().encode(env.JWT_SECRET)
    const { payload } = await jwtVerify(token, JWT_SECRET)
    const user = payload.user as User

    return env.ADMIN_EMAILS.includes(user.email)
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('JWT verification failed:', error)
    }
    return false
  }
}
