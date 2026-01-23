import type { Page } from '@playwright/test'
import { SignJWT } from 'jose'

import { env } from '@/lib/env'
import { JWT_COOKIE } from '@/utils/isAuthorized'

const adminEmail = 'test@email.com'
const issuer = 'kulumasiina'

export async function getAdminToken() {
  return await new SignJWT({
    user: {
      email: adminEmail,
      name: 'Playwright Admin'
    }
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(issuer)
    .setExpirationTime('10h')
    .sign(new TextEncoder().encode(env.JWT_SECRET))
}

export async function getAdminCookieHeader() {
  const token = await getAdminToken()
  return `${JWT_COOKIE}=${token}`
}

export async function loginAdmin(page: Page) {
  const jwt = await getAdminToken()

  await page.context().addCookies([
    {
      name: JWT_COOKIE,
      value: jwt,
      url: 'http://localhost:3000',
      httpOnly: true
    }
  ])
}
