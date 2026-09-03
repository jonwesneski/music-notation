import { defineConfig } from 'vite';

// `vite serve` (Playwright browser tests, port 5179) uses only the `server`
// block. `vite build` produces the standalone single-file bundle for CDN /
// plain-`<script>` use — the npm package's multi-file ESM + types still come
// from `tsc --build tsconfig.lib.json` (the `build` target).
export default defineConfig({
  server: {
    port: 5179,
    strictPort: true,
    fs: {
      allow: ['..', '../..'],
    },
  },
  build: {
    outDir: 'dist/standalone',
    emptyOutDir: true,
    lib: {
      entry: 'src/index.ts',
      name: 'MusicNotation',
      formats: ['es', 'umd'],
      fileName: (format) =>
        format === 'es' ? 'music-notation.js' : 'music-notation.umd.cjs',
    },
    rollupOptions: {
      // The library has no runtime dependencies — bundle everything so a single
      // file is self-contained.
      external: [],
      // Every element module registers a custom element as a side effect; keep
      // them all even though the entry re-exports nothing that references them.
      treeshake: { moduleSideEffects: true },
    },
  },
});
