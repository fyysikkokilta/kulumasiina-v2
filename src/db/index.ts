import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

import { env } from '@/lib/env'
import { relations } from '@/db/relations'

const client = new Pool({
  connectionString: env.DATABASE_URL
})

export const db = drizzle({ client, relations })
