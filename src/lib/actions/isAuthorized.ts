import { redirect } from 'next/navigation'
import { MiddlewareResult } from 'next-safe-action'

import { requireAuth } from '../auth'

export const isAuthorizedMiddleware = async ({
  next
}: {
  next: <NC extends object>(opts?: {
    ctx?: NC | undefined
  }) => Promise<MiddlewareResult<string, NC>>
}) => {
  const authorized = await requireAuth()

  if (!authorized) {
    redirect('/login')
  }
  return next()
}
