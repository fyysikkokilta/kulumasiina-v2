import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { Pool } from 'pg'

import { startFakeNocfo } from './utils/fake-nocfo'

const FAKE_NOCFO_PORT = 55433

// Brings the test database schema up to date, so a fresh `pnpm test:db` is all
// the database setup a test run needs.
export default async function globalSetup() {
  const url = process.env.DATABASE_URL
  const client = new Pool({ connectionString: url, max: 1 })
  try {
    await migrate(drizzle({ client }), { migrationsFolder: 'src/drizzle' })
  } catch (error) {
    throw new Error(
      `Could not migrate the test database at ${url}. Start one with \`pnpm test:db\`.`,
      { cause: error }
    )
  } finally {
    await client.end()
  }

  const nocfo = await startFakeNocfo(FAKE_NOCFO_PORT)
  return () => nocfo.close()
}
