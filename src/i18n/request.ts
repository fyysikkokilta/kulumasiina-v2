import { cookies } from 'next/headers'
import { Locale } from 'next-intl'
import { getRequestConfig } from 'next-intl/server'

export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const locale = (cookieStore.get('lang')?.value || 'fi') as Locale

  return {
    locale,
    messages: (
      (await import(`../../messages/${locale}.json`)) as {
        default: Record<string, string>
      }
    ).default
  }
})
