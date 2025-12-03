import { cacheTag } from 'next/cache'
import { cookies } from 'next/headers'
import { Locale } from 'next-intl'

import { redirect } from '@/i18n/navigation'
import { db } from '@/lib/db'
import isAuthorized, { JWT_COOKIE } from '@/utils/isAuthorized'

export const getAdminEntries = async (locale: Locale) => {
  'use cache: private'
  cacheTag('admin-entries')

  const cookieStore = await cookies()
  const token = cookieStore.get(JWT_COOKIE)?.value
  const authorized = await isAuthorized(token)
  if (!authorized) {
    redirect({ href: `/${locale}/login`, locale })
  }

  const entries = await db.query.entries.findMany({
    with: {
      items: {
        with: {
          attachments: true
        }
      },
      mileages: true
    }
  })
  return entries
}

export type AdminEntries = Awaited<ReturnType<typeof getAdminEntries>>
