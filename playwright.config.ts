import { defineConfig, devices } from '@playwright/test'

// Tests deliberately do not read .env: the seed deletes every entry, so they
// must never point at a dev database by accident. These defaults are the whole
// env contract for local and CI runs; anything already set in the shell wins,
// except NOCFO_* below.
const testEnv = {
  DATABASE_URL: 'postgresql://postgres:postgres@localhost:55432/kulumasiina_test',
  JWT_SECRET: 'test-jwt-secret',
  ADMIN_EMAILS: 'test@email.com',
  GOOGLE_CLIENT_ID: 'test-google-client-id',
  GOOGLE_CLIENT_SECRET: 'test-google-client-secret',
  GOOGLE_REDIRECT_URI: 'http://localhost:3000/api/auth/google/callback',
  BASE_URL: 'http://localhost:3000',
  FILE_CLEANUP_SECRET: 'test-cleanup-secret'
}
for (const [key, value] of Object.entries(testEnv)) {
  process.env[key] ??= value
}

// Always forced: a NOCFO_* exported in the shell must never send test documents to real NoCFO
const nocfoTestEnv = {
  NOCFO_API_URL: 'http://localhost:55433',
  NOCFO_API_TOKEN: 'test-nocfo-token',
  NOCFO_BUSINESS_SLUG: 'test-guild',
  NOCFO_BANK_ACCOUNT: '1910'
}
for (const [key, value] of Object.entries(nocfoTestEnv)) {
  process.env[key] = value
}

// Set by `pnpm test:node` for tests that need neither the app nor the database
const nodeOnly = !!process.env.PW_NODE_ONLY

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: 1,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:3000/en/',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry'
  },

  /* Configure projects for major browsers */
  projects: process.env.CI
    ? [
        // In CI, only run Chromium for faster test execution
        {
          name: 'chromium',
          use: {
            ...devices['Desktop Chrome'],
            contextOptions: {
              permissions: ['clipboard-read', 'clipboard-write']
            }
          }
        }
      ]
    : [
        // Local development: run all browsers
        {
          name: 'chromium',
          use: {
            ...devices['Desktop Chrome'],
            contextOptions: {
              permissions: ['clipboard-read', 'clipboard-write']
            }
          }
        },

        {
          name: 'firefox',
          use: {
            ...devices['Desktop Firefox'],
            contextOptions: {
              permissions: ['clipboard-read']
            }
          }
        },

        {
          name: 'webkit',
          use: {
            ...devices['Desktop Safari'],
            contextOptions: {
              permissions: ['clipboard-read']
            }
          }
        }

        /* Test against mobile viewports. */
        // {
        //   name: 'Mobile Chrome',
        //   use: { ...devices['Pixel 5'] },
        // },
        // {
        //   name: 'Mobile Safari',
        //   use: { ...devices['iPhone 12'] },
        // },

        /* Test against branded browsers. */
        // {
        //   name: 'Microsoft Edge',
        //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
        // },
        // {
        //   name: 'Google Chrome',
        //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
        // },
      ],

  globalSetup: nodeOnly ? undefined : './tests/global-setup.ts',

  /* Start a dev server with the test env. A server you already run would use your
     own .env and database, so an occupied port fails the run instead of reusing it. */
  webServer: nodeOnly
    ? undefined
    : {
        command: 'pnpm dev',
        url: 'http://localhost:3000/',
        reuseExistingServer: false,
        env: {
          STORAGE_DRIVER: 'local'
        }
      }
})
