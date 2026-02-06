import { defineConfig } from 'vite';

// Strip import map from built index.html so deploy doesn't request node_modules
function stripImportMap() {
  return {
    name: 'strip-importmap',
    transformIndexHtml(html) {
      return html.replace(/<script type="importmap" id="importmap-dev">[\s\S]*?<\/script>\s*/i, '');
    },
  };
}

// Bundle the app and @braze/web-sdk for production so Vercel doesn't need to serve node_modules
export default defineConfig({
  root: '.',
  plugins: [stripImportMap()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: 'index.html',
    },
  },
});
