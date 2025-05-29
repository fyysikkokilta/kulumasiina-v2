'use server'

import { redirect } from 'next/navigation'

import { deleteSession } from '../auth'
import { actionClient } from './safeActionClient'

export const logoutAction = actionClient.action(async () => {
  await deleteSession()
  redirect('/')
})
