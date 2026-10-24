import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Relative base + hash routing means `dist/` works from any static host without rewrites.
export default defineConfig({
  base: './',
  plugins: [react()],
});
