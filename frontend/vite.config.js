import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5000,
    strictPort: true,
    allowedHosts: ['.replit.dev', '.repl.co'],
    hmr: {
      overlay: false
    }
  },
  preview: {
    host: '0.0.0.0',
    port: 5000,
    strictPort: true
  }
});
