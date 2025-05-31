'use client'

import { Button, Space } from 'antd'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'

export function Login() {
  const router = useRouter()
  const t = useTranslations('login')

  const handleGoogleLogin = () => {
    window.location.href = '/api/auth/google'
  }

  return (
    <div className="flex min-h-96 flex-col items-center justify-center space-y-8">
      <div className="text-center">
        <h2 className="mb-4 text-2xl font-bold">{t('title')}</h2>
        <p className="mb-8 text-gray-600">{t('description')}</p>
      </div>

      <Space size="large">
        <Button type="primary" size="large" onClick={handleGoogleLogin}>
          {t('login_google')}
        </Button>
        <Button size="large" onClick={() => router.push('/')}>
          {t('cancel')}
        </Button>
      </Space>
    </div>
  )
}
