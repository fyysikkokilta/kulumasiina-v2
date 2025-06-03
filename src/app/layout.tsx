import './globals.css'
import '@ant-design/v5-patch-for-react-19'

import { AntdRegistry } from '@ant-design/nextjs-registry'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getTranslations } from 'next-intl/server'

export const generateMetadata = async () => {
  const t = await getTranslations()
  return {
    title: t('metadata.title'),
    description: t('metadata.description')
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  return (
    <html lang={locale}>
      <body>
        <AntdRegistry>
          <NextIntlClientProvider>{children}</NextIntlClientProvider>
        </AntdRegistry>
      </body>
    </html>
  )
}
