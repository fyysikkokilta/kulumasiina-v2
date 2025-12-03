import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

// Environment configuration with type safety and validation
export const env = createEnv({
  server: {
    // Google OAuth Configuration
    GOOGLE_CLIENT_ID: z.string(),
    GOOGLE_CLIENT_SECRET: z.string(),
    GOOGLE_REDIRECT_URI: z.string().url(),

    // Database Configuration
    DATABASE_URL: z.string().url(),

    // Admin Configuration
    ADMIN_EMAILS: z
      .string()
      .transform((val) => val.split(',').map((email) => email.trim()))
      .refine((val) => val.every((email) => email.includes('@')), {
        message:
          'ADMIN_EMAILS must be a comma-separated list of email addresses'
      }),

    MILEAGE_PROCOUNTOR_PRODUCT_ID: z.string().default('v2025_kmkorv'),

    // JWT Configuration
    JWT_SECRET: z.string(),
    JWT_EXPIRY_MINUTES: z
      .string()
      .default('180')
      .transform((val) => parseInt(val, 10)),

    // Environment
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
    BASE_URL: z.string(),

    // Storage configuration
    STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
    S3_ENDPOINT: z.string().url().optional(),
    S3_ACCESS_KEY: z.string().optional(),
    S3_SECRET_KEY: z.string().optional(),
    S3_BUCKET: z.string().optional(),
    S3_REGION: z.string().optional(),

    // File cleanup secret
    FILE_CLEANUP_SECRET: z.string()
  },
  client: {
    NEXT_PUBLIC_ARCHIVED_ENTRIES_AGE_LIMIT_DAYS: z
      .string()
      .default('30')
      .transform((val) => parseInt(val, 10)),
    NEXT_PUBLIC_MILEAGE_REIMBURSEMENT_RATE: z
      .string()
      .default('0.25')
      .transform((val) => parseFloat(val)),
    NEXT_PUBLIC_PRIVACY_POLICY_URL: z
      .string()
      .url()
      .default(
        'https://drive.google.com/drive/folders/12VBoHzXG7vEYGul87egYQZ3QN_-CKpBa'
      )
  },
  experimental__runtimeEnv: {
    NEXT_PUBLIC_ARCHIVED_ENTRIES_AGE_LIMIT_DAYS:
      process.env.NEXT_PUBLIC_ARCHIVED_ENTRIES_AGE_LIMIT_DAYS,
    NEXT_PUBLIC_MILEAGE_REIMBURSEMENT_RATE:
      process.env.NEXT_PUBLIC_MILEAGE_REIMBURSEMENT_RATE,
    NEXT_PUBLIC_PRIVACY_POLICY_URL: process.env.NEXT_PUBLIC_PRIVACY_POLICY_URL
  },
  emptyStringAsUndefined: true,
  skipValidation: process.env.SKIP_ENV_VALIDATION === 'true'
})
