import { cookies } from 'next/headers'

import isAuthorized, { JWT_COOKIE } from '@/utils/isAuthorized'

import { LoginButton } from './LoginButton'

export async function HeaderAuth() {
  const cookieStore = await cookies()
  const token = cookieStore.get(JWT_COOKIE)?.value
  const authorized = await isAuthorized(token)

  return <LoginButton authorized={authorized} />
}
