import { Separator } from '@base-ui/react/separator'
import { notFound } from 'next/navigation'
import { hasLocale, Locale, NextIntlClientProvider } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'

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

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider>
          <div className="mx-6 my-8 min-h-screen">
            <div className="mx-auto w-full max-w-6xl">
              <Header />
              <Separator className="my-4" />
              <div>{children}</div>
            </div>
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
