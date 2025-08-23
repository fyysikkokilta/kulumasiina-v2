import '@ant-design/v5-patch-for-react-19'

import { AntdRegistry } from '@ant-design/nextjs-registry'
import { Divider } from 'antd'
import { notFound } from 'next/navigation'
import { hasLocale, Locale, NextIntlClientProvider } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { Header } from '@/components/Header'
import { routing } from '@/i18n/routing'

export const generateStaticParams = async () => {
  // Cannot pre-render in CI since admin page needs the database
  return Promise.resolve([])
}

export async function generateMetadata({ params }: LayoutProps<'/[locale]'>) {
  const { locale } = await params
  const nextIntlLocale = locale as Locale
  const t = await getTranslations({ locale: nextIntlLocale, namespace: 'metadata' })
  return {
    title: t('title'),
    description: t('description')
  }
}

export default async function LocaleLayout({ children, params }: LayoutProps<'/[locale]'>) {
  const { locale } = await params

  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }

  setRequestLocale(locale)

  return (
    <html lang={locale}>
      <body>
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
      </body>
    </html>
  )
}
