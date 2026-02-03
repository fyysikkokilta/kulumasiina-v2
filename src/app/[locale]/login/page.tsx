/* eslint-disable no-restricted-imports */

import NextLink from 'next/link'
import { getTranslations } from 'next-intl/server'

import { Link } from '@/i18n/navigation'

export default async function LoginPage() {
  const t = await getTranslations('Login')

  return (
    <div className="flex min-h-96 flex-col items-center justify-center space-y-8">
      <div className="text-center">
        <h2 className="mb-4 text-2xl font-bold">{t('title')}</h2>
        <p className="mb-8 text-gray-600">{t('description')}</p>
      </div>

      <div className="flex max-w-xs flex-col justify-center gap-4 sm:flex-row sm:gap-8">
        <NextLink
          href="/api/auth/google"
          className="inline-flex w-full items-center justify-center rounded-lg bg-blue-500 px-4 py-2 text-center text-base font-semibold text-white shadow transition-colors hover:bg-blue-600 sm:w-auto"
        >
          {t('login_google')}
        </NextLink>
        <Link
          href="/"
          className="inline-flex w-full items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-center text-base font-semibold text-gray-700 shadow transition-colors hover:bg-gray-100 sm:w-auto"
        >
          {t('cancel')}
        </Link>
      </div>
    </div>
  )
}
