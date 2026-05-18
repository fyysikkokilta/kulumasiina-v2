import { ExportPage } from '@/components/ExportPage'

interface ExportPageSearchParams {
  apiUrl?: string
}

export default async function ExportResultPage({
  searchParams
}: {
  searchParams: Promise<ExportPageSearchParams>
}) {
  const params = await searchParams
  const apiUrl = params.apiUrl ?? ''

  return <ExportPage apiUrl={apiUrl} />
}
