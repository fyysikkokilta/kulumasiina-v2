import { redirect } from 'next/navigation'

import { AdminEntryView } from '@/components/AdminEntryView'
import { Container } from '@/components/Container'
import { requireAuth } from '@/lib/auth'

export default async function AdminPage() {
  try {
    const user = await requireAuth()

    return (
      <Container width="wide" user={user}>
        <AdminEntryView />
      </Container>
    )
  } catch (error) {
    console.error(error)
    // If unauthorized, redirect to home
    redirect('/')
  }
}
