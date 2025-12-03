import { AntdRegistry } from '@ant-design/nextjs-registry'
import { Divider } from 'antd'
import { notFound } from 'next/navigation'
import { hasLocale, Locale, NextIntlClientProvider } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Suspense } from 'react'

import { Header } from '@/components/Header'
import { routing } from '@/i18n/routing'

export const generateStaticParams = async () => {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: LayoutProps<'/[locale]'>) {
  const { locale } = await params
  const nextIntlLocale = locale as Locale
  const t = await getTranslations({
    locale: nextIntlLocale,
    namespace: 'metadata'
  })
  return {
    title: t('title'),
    description: t('description')
  }
}

export default async function LocaleLayout({
  children,
  params
}: LayoutProps<'/[locale]'>) {
  const { locale } = await params

  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }

  setRequestLocale(locale)

  const t = await getTranslations('common')

  return (
    <html lang={locale}>
      <body>
        {/* Antd uses Date.now and Math.random... */}
        <Suspense fallback={t('loading')}>
          <AntdRegistry>
            <NextIntlClientProvider>
              <div className="mx-6 my-8 min-h-screen">
                <div className="mx-auto w-full max-w-6xl">
                  <Header />
                  <Divider />
                  <div>{children}</div>
                </div>
              </div>
            </NextIntlClientProvider>
          </AntdRegistry>
        </Suspense>
      </body>
    </html>
  )
}
