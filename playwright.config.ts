import {defineConfig,devices} from '@playwright/test';

const e2eFrontendPort=4383;
const e2eApiPort=4384;
const e2eOrigin=`http://127.0.0.1:${e2eFrontendPort}`;
process.env.CIPHERTEXT_API_PORT=String(e2eApiPort);
process.env.CIPHERTEXT_E2E_ORIGIN=e2eOrigin;

export default defineConfig({
  testDir:'./e2e', fullyParallel:false, workers:1, reporter:'list',
  use:{...devices['Desktop Chrome'],baseURL:e2eOrigin},
  webServer:[
    {command:`CIPHERTEXT_FRONTEND_ORIGINS=${e2eOrigin} CIPHERTEXT_API_PORT=${e2eApiPort} CIPHERTEXT_DATA_DIR=/tmp/ciphertext-e2e-${process.pid} node src/server/index.mjs`,url:`http://127.0.0.1:${e2eApiPort}/api/health`,reuseExistingServer:false,timeout:30_000},
    {command:`CIPHERTEXT_API_PORT=${e2eApiPort} pnpm exec vite --host 127.0.0.1 --port ${e2eFrontendPort}`,url:e2eOrigin,reuseExistingServer:false,timeout:30_000},
  ],
});
