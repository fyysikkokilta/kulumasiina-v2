import { Container } from '@/components/Container'
import { ExpenseForm } from '@/components/ExpenseForm'
import { getUserFromCookies } from '@/lib/auth'

export default async function HomePage() {
  const user = await getUserFromCookies()

  return (
    <Container width="narrow" user={user}>
      <ExpenseForm />
    </Container>
  )
}
