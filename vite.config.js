/// <reference types="vitest" />

import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const __dirname = dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    minify: false,
    lib: {
      entry: resolve(__dirname, 'src/index.js'),
      name: 'yio-map',
      fileName: 'yio-map',
      formats: ['es'],
    },
    rollupOptions: {
      external: id => /ol(\/.+)?$/.test(id),
      output: {
        globals: id =>
          /ol(\/.+)?$/.test(id)
            ? id.replace(/\.js$/, '').split('/').join('.')
            : id,
      },
    },
  },
  test: {
    globals: true,
    browser: {
      provider: 'playwright',
      headless: true,
      enabled: true,
      // at least one instance is required
      instances: [{ browser: 'chromium' }],
    },
  },
});
