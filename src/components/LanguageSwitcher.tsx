'use client'

import { useParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useTransition } from 'react'

import { usePathname, useRouter } from '@/i18n/navigation'

export function LanguageSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const params = useParams()
  const [isPending, startTransition] = useTransition()
  const t = useTranslations('LanguageSwitcher')

  const toggleLanguage = () => {
    const newLocale = locale === 'en' ? 'fi' : 'en'
    startTransition(() => {
      // @ts-expect-error -- TypeScript will validate that only known `params`
      // are used in combination with a given `pathname`. Since the two will
      // always match for the current route, we can skip runtime checks.
      router.replace({ pathname, params }, { locale: newLocale })
    })
  }

  return (
    <button
      className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-blue-500 px-3 py-1.5 text-base font-semibold text-white shadow transition-colors hover:bg-blue-600"
      disabled={isPending}
      type="button"
      onClick={toggleLanguage}
    >
      {t('other_language')}
    </button>
  )
}
