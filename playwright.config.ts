import {defineConfig,devices} from '@playwright/test';

export default defineConfig({
  testDir:'./e2e', fullyParallel:true, reporter:'list',
  use:{...devices['Desktop Chrome'],baseURL:'http://127.0.0.1:4173'},
  webServer:{command:`CIPHERTEXT_DATA_DIR=/tmp/ciphertext-e2e-${process.pid} pnpm dev --host 127.0.0.1 --port 4173`,url:'http://127.0.0.1:4173',reuseExistingServer:!process.env.CI,timeout:30_000},
});
