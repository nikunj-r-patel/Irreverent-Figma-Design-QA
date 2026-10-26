import dotenv from 'dotenv';
import { defineConfig, devices } from '@playwright/test';

dotenv.config();
export default defineConfig({
  testDir: './tests',

  timeout: 120000,

  expect: {
    timeout: 10000,
  },

  fullyParallel: false,

  forbidOnly: !!process.env.CI,

  retries: process.env.CI ? 2 : 0,

  workers: process.env.CI ? 1 : undefined,

  reporter: [
    ['list'],
    ['html', { outputFolder: 'reports/html', open: 'never' }],
  ],

  use: {
    screenshot: 'only-on-failure',

    video: 'retain-on-failure',

    trace: 'retain-on-failure',

    actionTimeout: 15000,

    navigationTimeout: 30000,

    ignoreHTTPSErrors: true,
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
});
