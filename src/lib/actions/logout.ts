'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { JWT_COOKIE } from '@/utils/isAuthorized'

import { actionClient } from './safeActionClient'

export const logoutAction = actionClient.action(async () => {
  const cookieStore = await cookies()
  cookieStore.delete(JWT_COOKIE)
  redirect('/')
})
