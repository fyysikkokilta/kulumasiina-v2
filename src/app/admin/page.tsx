import { AdminEntryView } from '@/components/admin/AdminEntryView'
import { Container } from '@/components/Container'
import { requireAuth } from '@/lib/auth'

export default async function AdminPage() {
  const user = await requireAuth()

  return (
    <Container width="wide" user={user}>
      <AdminEntryView />
    </Container>
  )
}
