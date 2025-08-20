import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  out: './src/drizzle',
  schema: './src/lib/db/schema.ts',
  dialect: 'postgresql',
  casing: 'snake_case',
  dbCredentials: {
    url: process.env.DATABASE_URL!
  },
  strict: true,
  verbose: true
})
