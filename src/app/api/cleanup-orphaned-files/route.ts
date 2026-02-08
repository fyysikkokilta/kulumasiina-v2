import { NextRequest, NextResponse } from 'next/server'

import { cleanupOrphanedFiles } from '@/lib/cleanupOrphanedFiles'
import { env } from '@/lib/env'

export async function POST(req: NextRequest) {
  const secret = env.FILE_CLEANUP_SECRET
  const provided = req.headers.get('x-cleanup-secret') || req.nextUrl.searchParams.get('secret')

  if (!secret || !provided || provided !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const deleted = await cleanupOrphanedFiles()
    return NextResponse.json({
      success: true,
      deletedCount: deleted.length,
      deleted
    })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message || 'Cleanup failed' }, { status: 500 })
  }
}
