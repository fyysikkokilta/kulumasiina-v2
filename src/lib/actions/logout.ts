'use server'

import { cookies } from 'next/headers'
import { Locale } from 'next-intl'

import { redirect } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'
import { JWT_COOKIE } from '@/utils/isAuthorized'

import { actionClient } from './safeActionClient'

export const logoutAction = actionClient.action(async () => {
  const cookieStore = await cookies()
  const locale = (cookieStore.get('NEXT_LOCALE')?.value || routing.defaultLocale) as Locale
  cookieStore.delete(JWT_COOKIE)
  redirect({ href: '/', locale })
})
