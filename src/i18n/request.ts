import { hasLocale } from 'next-intl'
import { getRequestConfig } from 'next-intl/server'

import en from './en'
import fi from './fi'
import { routing } from './routing'

const messages = { en, fi }

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale

  return {
    locale,
    messages: messages[locale as keyof typeof messages] as typeof en
  }
})
