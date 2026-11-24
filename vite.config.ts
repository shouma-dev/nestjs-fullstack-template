import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';
export default defineConfig({ root: 'client', plugins: [react(), tailwindcss()], resolve: { alias: { '@': fileURLToPath(new URL('./client/src', import.meta.url)) } }, build: { outDir: '../dist/client', emptyOutDir: true }, server: { host: '127.0.0.1', port: Number(process.env.CLIENT_PORT ?? 5173), strictPort: true, proxy: { '/api': { target: `http://127.0.0.1:${process.env.PORT ?? 3001}`, rewrite: path => path.replace(/^\/api/, '') } } } });
