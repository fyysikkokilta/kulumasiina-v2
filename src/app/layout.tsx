import './globals.css'
import '@ant-design/v5-patch-for-react-19'

import { AntdRegistry } from '@ant-design/nextjs-registry'
import { Divider } from 'antd'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getTranslations } from 'next-intl/server'

import { Header } from '@/components/Header'

export const generateMetadata = async () => {
  const t = await getTranslations()
  return {
    title: t('metadata.title'),
    description: t('metadata.description')
  }
}

export default async function RootLayout({ children }: LayoutProps<'/'>) {
  const locale = await getLocale()
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
