'use client'

import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'

import { LoginBtn } from './LoginBtn'

export function HeaderButtons({ authorized }: { authorized: boolean }) {
  const locale = useLocale()
  const router = useRouter()

  const changeLocale = (locale: string) => {
    document.cookie = `lang=${locale}; path=/; max-age=31536000`
    router.refresh()
  }

  const otherLocale = locale === 'fi' ? 'en' : 'fi'
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => changeLocale(otherLocale)}
        className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-blue-500 px-3 py-1.5 text-base font-semibold text-white shadow transition-colors hover:bg-blue-600"
      >
        {otherLocale.toUpperCase()}
      </button>
      <LoginBtn authorized={authorized} />
    </div>
  )
}
