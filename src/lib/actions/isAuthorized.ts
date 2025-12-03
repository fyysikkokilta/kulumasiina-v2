import { cookies } from 'next/headers'
import { createMiddleware } from 'next-safe-action'

import isAuthorized, { JWT_COOKIE } from '@/utils/isAuthorized'

export const isAuthorizedMiddleware = createMiddleware().define(
  async ({ next }) => {
    const cookieStore = await cookies()
    const token = cookieStore.get(JWT_COOKIE)?.value
    const authorized = await isAuthorized(token)
    if (!authorized) {
      throw new Error('Unauthorized')
    }
    return next()
  }
)
