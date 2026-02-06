import { defineConfig } from 'vite';

// Bundle the app and @braze/web-sdk for production so Vercel doesn't need to serve node_modules
export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: 'index.html',
    },
  },
});
