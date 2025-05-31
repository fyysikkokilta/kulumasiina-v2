import { Container } from '@/components/Container'
import { Login } from '@/components/Login'
import { getUserFromCookies } from '@/lib/auth'

export default async function LoginPage() {
  const user = await getUserFromCookies()

  return (
    <Container width="narrow" user={user}>
      <Login />
    </Container>
  )
}
