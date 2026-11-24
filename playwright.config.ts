import { defineConfig, devices } from '@playwright/test'

const port = 3210

export default defineConfig({
  testDir: './tests/e2e',
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:' + port,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'node tests/e2e/start-server.mjs',
    env: { CONTENTCHECK_E2E_PORT: String(port) },
    url: 'http://127.0.0.1:' + port + '/login',
    timeout: 120_000,
    reuseExistingServer: false,
    gracefulShutdown: { signal: 'SIGTERM', timeout: 5000 },
  },
})
