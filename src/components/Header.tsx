'use client'

import { Button, Space, Typography } from 'antd'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useEffect } from 'react'

import { LoginBtn } from '@/components/LoginBtn'
import type { User } from '@/lib/auth'

interface HeaderProps {
  user: User | null
}

export function Header({ user }: HeaderProps) {
  const t = useTranslations('form.main')
  const locale = useLocale()
  const router = useRouter()

  useEffect(() => {
    document.title = t('title')
  }, [locale, t])

  const changeLocale = (locale: string) => {
    document.cookie = `lang=${locale}; path=/; max-age=31536000`
    router.refresh()
  }

  const otherLocale = locale === 'fi' ? 'en' : 'fi'

  return (
    <div className="flex items-baseline justify-between">
      <Typography.Title level={1} className="!text-2xl">
        {t('title')}
      </Typography.Title>
      <div>
        <Space>
          <Button
            type="primary"
            className="mx-2"
            onClick={() => {
              changeLocale(otherLocale)
            }}
          >
            {otherLocale.toUpperCase()}
          </Button>
          <LoginBtn user={user} />
        </Space>
      </div>
    </div>
  )
}
