import { getTranslations } from 'next-intl/server'
import { Suspense } from 'react'

import { HeaderAuth } from './HeaderAuth'
import { LanguageSwitcher } from './LanguageSwitcher'

export async function Header() {
  const t = await getTranslations('form.main')

  return (
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-bold">{t('title')}</h1>
      <div className="flex items-center gap-2">
        <Suspense
          fallback={
            <div className="inline-flex h-10.5 w-24 cursor-pointer items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-center text-base font-semibold text-gray-700 shadow">
              <div className="h-4 w-20 animate-pulse rounded bg-gray-300"></div>
            </div>
          }
        >
          <HeaderAuth />
        </Suspense>
        <LanguageSwitcher />
      </div>
    </div>
  )
}
