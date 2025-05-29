'use client'

import { Button } from 'antd'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'

import { logoutAction } from '@/lib/actions/logout'
import type { User } from '@/lib/auth'

interface LoginBtnProps {
  user: User | null
}

export function LoginBtn({ user }: LoginBtnProps) {
  const router = useRouter()
  const t = useTranslations('login')

  const handleLogout = async () => {
    await logoutAction()
  }

  return user ? (
    <Button onClick={handleLogout}>{t('logout')}</Button>
  ) : (
    <Button onClick={() => router.push('/login')}>{t('login')}</Button>
  )
}
