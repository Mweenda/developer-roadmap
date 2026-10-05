import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src/public',
  publicDir: false,
  appType: 'spa',
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://127.0.0.1:3000',
    },
  },
  preview: {
    proxy: {
      '/api': 'http://127.0.0.1:3000',
    },
  },
  build: {
    outDir: '../../public',
    emptyOutDir: true,
  },
});
