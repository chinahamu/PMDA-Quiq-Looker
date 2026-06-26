import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

const rootDir = fileURLToPath(new URL('.', import.meta.url));

function copyManifest(): Plugin {
  return {
    name: 'copy-extension-manifest',
    closeBundle() {
      const source = resolve(rootDir, 'src', 'manifest.json');
      const destination = resolve(rootDir, 'dist', 'manifest.json');

      mkdirSync(dirname(destination), { recursive: true });
      copyFileSync(source, destination);
    },
  };
}

export default defineConfig({
  root: resolve(rootDir, 'src'),
  publicDir: resolve(rootDir, 'public'),
  plugins: [react(), copyManifest()],
  build: {
    outDir: resolve(rootDir, 'dist'),
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: {
        'popup/index': resolve(rootDir, 'src', 'popup', 'index.html'),
        'sidepanel/sidepanel': resolve(rootDir, 'src', 'sidepanel', 'sidepanel.html'),
        'background/index': resolve(rootDir, 'src', 'background', 'index.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
});
