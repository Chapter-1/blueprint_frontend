import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import VueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'
import { viteStaticCopy } from 'vite-plugin-static-copy'

export default defineConfig({
  base: '/', // GitHub Pages 경로로 수정
  plugins: [
    vue(),
    VueDevTools(),
    viteStaticCopy({
      targets: [
        {
          src: 'public/404.html', // 프로젝트 내 위치
          dest: '.', // dist 디렉토리 루트로 복사
        },
      ],
    }),
  ],
  define: {
    'import.meta.env.VITE_APP_API_URL': JSON.stringify(process.env.VITE_APP_API_URL),
  },
  optimizeDeps: {
    include: ['jwt-decode'],
  },
  css: {
    postcss: {
      plugins: [tailwindcss, autoprefixer],
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
