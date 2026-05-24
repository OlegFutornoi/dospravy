import { defineConfig, devices } from '@playwright/test';

type TestEnv = 'dev' | 'stage' | 'prod';
type AppArea = 'business' | 'crm' | 'combined';

const baseUrls: Record<AppArea, Record<TestEnv, string>> = {
  business: {
    dev: 'https://business-dev.dospravy.com.ua/',
    stage: 'https://business-staging.dospravy.com.ua/',
    prod: 'https://business.dospravy.com.ua/',
  },
  crm: {
    dev: 'https://crm-dev.dospravy.com.ua/',
    stage: 'https://crm-staging.dospravy.com.ua/',
    prod: 'https://crm.dospravy.com.ua/',
  },
  combined: {
    dev: 'https://business-dev.dospravy.com.ua/',
    stage: 'https://business-staging.dospravy.com.ua/',
    prod: 'https://business.dospravy.com.ua/',
  },
};

const selectedApp = (process.env.APP_AREA ?? 'business') as AppArea;
const selectedEnv = (process.env.TEST_ENV ?? process.env.BUSINESS_ENV ?? 'stage') as TestEnv;
const baseURL = baseUrls[selectedApp]?.[selectedEnv] ?? baseUrls.business.stage;

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests (OTP авторизація нестабільна при паралельному запуску). */
  workers: 1,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { outputFolder: 'reports/html' }],
    ['junit', { outputFile: 'reports/junit/results.xml' }],
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    baseURL,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

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

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
