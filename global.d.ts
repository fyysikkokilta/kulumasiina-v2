import messages from './messages/fi.json'

declare module 'next-intl' {
  interface AppConfig {
    Locale: 'fi' | 'en'
    Messages: typeof messages
  }
}
