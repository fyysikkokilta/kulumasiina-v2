import './globals.css'
import '@ant-design/v5-patch-for-react-19'

import { AntdRegistry } from '@ant-design/nextjs-registry'
import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale } from 'next-intl/server'

export const metadata: Metadata = {
  title: 'Kulumasiina',
  description: 'Expense management system'
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
