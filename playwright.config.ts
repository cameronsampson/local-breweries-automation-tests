import { defineConfig, devices } from '@playwright/test';
import 'dotenv/config';

const SITE_URL = process.env.SITE_URL ?? 'https://www.openbrewerydb.org';
const API_URL = process.env.API_URL ?? 'https://api.openbrewerydb.org';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
  ],
  use: {
    baseURL: SITE_URL,
    extraHTTPHeaders: {
      Accept: 'application/json',
    },
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'frontend',
      testDir: './tests/frontend',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'api',
      testDir: './tests/api',
      use: { baseURL: API_URL },
    },
  ],
});
