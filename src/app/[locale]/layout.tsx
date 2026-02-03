import '@/app/globals.css'

import { Separator } from '@base-ui/react/separator'
import { locale } from 'next/root-params'
import { NextIntlClientProvider } from 'next-intl'
import { getTranslations } from 'next-intl/server'

import { Header } from '@/components/Header'
import { routing } from '@/i18n/routing'

export const generateStaticParams = async () => {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata() {
  const t = await getTranslations('metadata')
  return {
    title: t('title'),
    description: t('description')
  }
}

export default async function LocaleLayout({
  children
}: LayoutProps<'/[locale]'>) {
  const curLocale = await locale()

  return (
    <html lang={curLocale}>
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
