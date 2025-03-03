/// <reference types="vitest" />

import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import https from 'node:https';
import { defineConfig, loadEnv } from 'vite';

const __dirname = dirname(fileURLToPath(import.meta.url));

const externalRegEx = /(ol|ol-mapbox-style)(\/.+)?$/;

export default ({ mode }) => {
  const env = { ...process.env, ...loadEnv(mode, process.cwd(), '') };

  // https://vitejs.dev/config/
  const config = defineConfig({
    build: {
      minify: false,
      lib: {
        entry: resolve(__dirname, 'src/index.js'),
        name: 'yio-map',
        fileName: 'yio-map',
        formats: ['es'],
      },
      rollupOptions: {
        external: id => externalRegEx.test(id),
        output: {
          globals: id =>
            externalRegEx.test(id)
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

  if (env.API_TARGET && env.COOKIE) {
    config.server = {
      proxy: {
        '^/api/': {
          target: env.API_TARGET,
          changeOrigin: true,
          agent: https.globalAgent,
          proxyTimeout: 600 * 1000,
          timeout: 600 * 1000,
          headers: {
            Cookie: env.COOKIE,
          },
        },
      },
    };
  }

  return config;
};
