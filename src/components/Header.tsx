'use client'

import { Space, Typography } from 'antd'
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

  return (
    <div className="flex items-baseline justify-between">
      <Typography.Title level={1}>{t('title')}</Typography.Title>
      <div>
        <Space>
          <div>
            <Typography.Text
              className={`cursor-pointer ${locale.startsWith('fi') ? 'font-bold' : 'font-normal'}`}
              onClick={() => {
                changeLocale('fi')
                document.cookie = 'lang=fi; path=/; max-age=31536000'
              }}
            >
              FI
            </Typography.Text>{' '}
            /{' '}
            <Typography.Text
              className={`cursor-pointer ${locale.startsWith('en') ? 'font-bold' : 'font-normal'}`}
              onClick={() => {
                changeLocale('en')
                document.cookie = 'lang=en; path=/; max-age=31536000'
              }}
            >
              EN
            </Typography.Text>
          </div>
          <LoginBtn user={user} />
        </Space>
      </div>
    </div>
  )
}
