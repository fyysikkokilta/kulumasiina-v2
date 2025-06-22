import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'

import { env } from './env'

export const JWT_COOKIE = 'auth-token'

export async function isAuthorized(): Promise<boolean> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(JWT_COOKIE)?.value

    if (!token) {
      return false
    }

    const { payload } = await jwtVerify(token, new TextEncoder().encode(env.JWT_SECRET), {
      algorithms: ['HS256'],
      issuer: 'kulumasiina'
    })
    const user = payload.user as {
      email: string
      name?: string
    }
    return env.ADMIN_EMAILS.includes(user.email)
  } catch (error) {
    console.error('JWT verification failed:', error)
    return false
  }
}
