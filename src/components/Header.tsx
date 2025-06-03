import { getTranslations } from 'next-intl/server'

import { getUserFromCookies } from '@/lib/auth'

import { HeaderButtons } from './HeaderButtons'

export async function Header() {
  const t = await getTranslations('form.main')
  const user = await getUserFromCookies()

  return (
    <div className="flex items-baseline justify-between">
      <h1 className="text-2xl font-bold">{t('title')}</h1>
      <div>
        <HeaderButtons user={user} />
      </div>
    </div>
  )
}
