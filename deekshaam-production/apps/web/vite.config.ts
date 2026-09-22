import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@deekshaam/types': path.resolve(__dirname, '../../packages/types/src'),
      '@deekshaam/validation': path.resolve(__dirname, '../../packages/validation/src'),
      '@deekshaam/ui': path.resolve(__dirname, '../../packages/ui/src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/public-media': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
