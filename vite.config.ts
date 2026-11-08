import {defineConfig} from 'vitest/config';
import react from '@vitejs/plugin-react';

const apiPort=Number(process.env.CIPHERTEXT_API_PORT||4174);

export default defineConfig({
  plugins: [react()],
  server: {host: '127.0.0.1', proxy: {'/api': `http://127.0.0.1:${apiPort}`,'/assets': `http://127.0.0.1:${apiPort}`}},
  test: {environment: 'node', include: ['tests/**/*.test.{ts,tsx,mjs}']},
});
