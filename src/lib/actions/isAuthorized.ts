import { MiddlewareResult } from 'next-safe-action'

import { requireAuth } from '../auth'

export const isAuthorizedMiddleware = async ({
  next
}: {
  next: <NC extends object>(opts?: {
    ctx?: NC | undefined
  }) => Promise<MiddlewareResult<string, NC>>
}) => {
  await requireAuth()
  return next()
}
