import { jwtVerify, SignJWT } from 'jose'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { env } from './env'

const JWT_SECRET = new TextEncoder().encode(env.JWT_SECRET)
const JWT_COOKIE_NAME = 'auth-token'
const JWT_DURATION = env.JWT_EXPIRY_MINUTES * 60

export interface User {
  email: string
  name?: string
}

export async function createJWTToken(user: User) {
  if (!env.ADMIN_EMAILS.includes(user.email)) {
    throw new Error('Only admin users are allowed to log in')
  }
  const token = await new SignJWT({ user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + JWT_DURATION)
    .sign(JWT_SECRET)

  const cookieStore = await cookies()
  cookieStore.set(JWT_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: JWT_DURATION
  })

  return token
}

export async function getUserFromCookies() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(JWT_COOKIE_NAME)?.value

    if (!token) {
      return null
    }

    const { payload } = await jwtVerify(token, JWT_SECRET)
    const user = payload.user as User
    if (!env.ADMIN_EMAILS.includes(user.email)) {
      return null
    }
    return user
  } catch (error) {
    console.error('JWT verification failed:', error)
    return null
  }
}

export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete(JWT_COOKIE_NAME)
}

export async function requireAuth() {
  const user = await getUserFromCookies()
  if (!user) {
    redirect('/')
  }
  return user
}

export function createUser(email: string, name?: string) {
  if (!env.ADMIN_EMAILS.includes(email)) {
    throw new Error('Only admin users are allowed to log in')
  }
  return {
    email,
    name
  }
}
