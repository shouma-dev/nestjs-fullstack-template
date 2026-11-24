import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  base: './',
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    fs: { allow: [fileURLToPath(new URL('../../../', import.meta.url))] },
  },
  build: {
    outDir: fileURLToPath(new URL('../../../dist/erp-preview', import.meta.url)),
    rollupOptions: { input: fileURLToPath(new URL('gallery.html', import.meta.url)) },
  },
});
