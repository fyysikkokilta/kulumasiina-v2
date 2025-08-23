import { Locale } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'

import { ExpenseForm } from '@/components/ExpenseForm'

export default async function FormPage({ params }: PageProps<'/[locale]'>) {
  const { locale } = await params
  setRequestLocale(locale as Locale)

  return <ExpenseForm />
}
