import { createMiddleware } from 'next-safe-action'

import { isAuthorized } from '../auth'

export const isAuthorizedMiddleware = createMiddleware().define(async ({ next }) => {
  const authorized = await isAuthorized()
  if (!authorized) {
    throw new Error('Unauthorized')
  }
  return next()
})
