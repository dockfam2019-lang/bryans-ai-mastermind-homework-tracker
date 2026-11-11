import { defineConfig, devices } from '@playwright/test'

// End-to-end tests run against the production build, with a fixed clock (Tuesday 2026-11-10, 12:00)
// so sample data and dates are predictable.
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  retries: 0,
  reporter: [['list']],
  use: {
    // E2E_BASE_URL=https://... runs the same tests against a deployed copy instead of a local build
    baseURL: process.env.E2E_BASE_URL ?? 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    serviceWorkers: 'block',
    // PW_CHANNEL=chrome uses the installed Google Chrome instead of the downloaded Chromium
    channel: process.env.PW_CHANNEL,
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: process.env.E2E_BASE_URL ? undefined : {
    command: 'npm run build && npx vite preview --port 4173 --host 127.0.0.1 --strictPort',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
