import { getTranslations } from 'next-intl/server'

import { isAuthorized } from '@/lib/auth'

import { HeaderButtons } from './HeaderButtons'

export async function Header() {
  const t = await getTranslations('form.main')
  const authorized = await isAuthorized()

  return (
    <div className="flex items-baseline justify-between">
      <h1 className="text-2xl font-bold">{t('title')}</h1>
      <div>
        <HeaderButtons authorized={authorized} />
      </div>
    </div>
  )
}
