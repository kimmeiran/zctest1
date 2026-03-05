import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [vue()],
    server: {
      port: 3001,
      open: true,
      proxy: {
        '/api': {
          target: 'http://192.168.2.249:8084/',
          changeOrigin: true,
        },
        // Images path
        '/images': {
          target: 'http://192.168.2.249:7093',
          changeOrigin: true
        }
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    build: {  
      outDir: 'public/dist', // Output directory
    },
    assetsInclude: ['**/*.xlsx'],
  }
})
