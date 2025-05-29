import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { Pool } from 'pg'

import { env } from '../env'
import * as schema from './schema'

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 1
})

const db = drizzle(pool, { schema })

try {
  await migrate(db, { migrationsFolder: './src/drizzle' })
  console.log('Migration successful')
} catch (error) {
  console.error('Migration failed:', error)
}
