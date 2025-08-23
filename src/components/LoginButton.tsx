'use client'

import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import { logoutAction } from '@/lib/actions/logout'

interface LoginButtonProps {
  authorized: boolean
}

export function LoginButton({ authorized }: LoginButtonProps) {
  const t = useTranslations('login')

  const handleLogout = async () => {
    await logoutAction()
  }

  return authorized ? (
    <button
      type="button"
      onClick={handleLogout}
      className="inline-flex w-full cursor-pointer items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-center text-base font-semibold text-gray-700 shadow transition-colors hover:bg-gray-100 sm:w-auto"
    >
      {t('logout')}
    </button>
  ) : (
    <Link
      href="/login"
      className="inline-flex w-full cursor-pointer items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-center text-base font-semibold text-gray-700 shadow transition-colors hover:bg-gray-100 sm:w-auto"
    >
      {t('login')}
    </Link>
  )
}
