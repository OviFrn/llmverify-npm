import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './demo',
  testMatch: '**/*.spec.ts',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'html',
  
  use: {
    trace: 'on-first-retry',
    video: {
      mode: 'on',
      size: { width: 1280, height: 720 }
    }
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    }
  ],

  outputDir: './demo/recordings'
});
