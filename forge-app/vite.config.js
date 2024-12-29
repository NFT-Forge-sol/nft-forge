import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill'
import inject from '@rollup/plugin-inject'

export default defineConfig({
  plugins: [
    react(),
    {
      ...inject({
        process: 'process/browser',
        Buffer: ['buffer', 'Buffer'],
      }),
      enforce: 'post',
    },
  ],
  define: {
    global: 'globalThis',
    'process.env': {},
  },
  resolve: {
    alias: {
      stream: 'stream-browserify',
      buffer: 'buffer',
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
  },
})
