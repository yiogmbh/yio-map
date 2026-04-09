import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    browser: {
      provider: 'playwright',
      headless: true,
      enabled: true,
      instances: [{ browser: 'chromium' }],
    },
  },
});