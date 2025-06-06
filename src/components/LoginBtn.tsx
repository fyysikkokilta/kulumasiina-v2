'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'

import { logoutAction } from '@/lib/actions/logout'
import type { User } from '@/lib/auth'

interface LoginBtnProps {
  user: User | null
}

export function LoginBtn({ user }: LoginBtnProps) {
  const t = useTranslations('login')

  const handleLogout = async () => {
    await logoutAction()
  }

  return user ? (
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
