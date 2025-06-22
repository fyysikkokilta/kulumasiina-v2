import { jwtVerify } from 'jose'
import { NextRequest, NextResponse } from 'next/server'

import { JWT_COOKIE } from './lib/auth'
import { env } from './lib/env'

const JWT_SECRET = new TextEncoder().encode(env.JWT_SECRET)

export interface User {
  email: string
  name?: string
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const token = request.cookies.get(JWT_COOKIE)?.value

  if (pathname === '/admin') {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET)
      const user = payload.user as User

      if (!env.ADMIN_EMAILS.includes(user.email)) {
        return NextResponse.redirect(new URL('/login', request.url))
      }

      return NextResponse.next()
    } catch (error) {
      console.error('JWT verification failed in middleware:', error)
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  if (token && pathname === '/login') {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET)
      const user = payload.user as User

      if (env.ADMIN_EMAILS?.includes(user.email)) {
        const adminUrl = new URL('/admin', request.url)
        return NextResponse.redirect(adminUrl)
      }
    } catch (error) {
      console.error('JWT verification failed in middleware:', error)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)']
}
