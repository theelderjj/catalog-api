import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright configuration for catalog-api E2E tests.
 *
 * Running `npm test` (or any playwright test command) will automatically:
 *   1. Start the Go backend   → http://localhost:8080
 *   2. Start the Vite frontend → http://localhost:5173
 *   3. Wait until both are ready (health-check polling)
 *   4. Run all tests
 *   5. Kill both processes when done
 *
 * If either service is already running locally, Playwright reuses it
 * instead of starting a second copy (controlled by reuseExistingServer).
 *
 * Override URLs for a deployed environment:
 *   API_URL=https://api.example.com BASE_URL=https://app.example.com npm test
 *   Add SKIP_SERVERS=true to skip the webServer block entirely.
 */

const skipServers = !!process.env.SKIP_SERVERS

export default defineConfig({
  testDir: './tests',
  outputDir: './test-results',

  // The backend uses an in-memory store with no test isolation — a reset in
  // one worker wipes state another worker is relying on.  Running serially
  // (workers: 1) is the only safe option for this architecture.
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,

  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],

  // -------------------------------------------------------------------------
  // Auto-start both services before any test runs.
  // Playwright polls the `url` until it gets a 2xx, then unblocks the tests.
  // Both processes are killed automatically when the test run finishes.
  // -------------------------------------------------------------------------
  webServer: skipServers ? [] : [
    {
      // Go backend — `go run` compiles and starts in one step.
      command: 'cd backend && go run main.go',
      url: 'http://localhost:8080/health',
      // In CI always start fresh; locally reuse if already running.
      reuseExistingServer: !process.env.CI,
      // Give Go up to 30 s to compile and start.
      timeout: 30_000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
    {
      // Vite dev server for the React frontend.
      command: 'cd frontend && npm run dev',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
      // Vite is fast but npm install may be needed on first run.
      timeout: 60_000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
  ],

  use: {
    // Frontend base URL for UI tests.
    baseURL: process.env.BASE_URL ?? 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      // API tests use the request fixture only — no browser window launched.
      // They run first so a UI-test reset can't corrupt mid-test API state.
      name: 'api',
      testDir: './tests/api',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.API_URL ?? 'http://localhost:8080',
      },
    },
    {
      // UI tests run after all API tests complete.
      name: 'ui-chrome',
      testDir: './tests/ui',
      dependencies: ['api'],
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.BASE_URL ?? 'http://localhost:5173',
      },
    },
    {
      name: 'ui-mobile',
      testDir: './tests/ui',
      dependencies: ['api'],
      use: {
        ...devices['Pixel 5'],
        baseURL: process.env.BASE_URL ?? 'http://localhost:5173',
      },
    },
  ],
})
