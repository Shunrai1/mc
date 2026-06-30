import path from 'node:path'
import { partytownVite } from '@builder.io/partytown/utils'
// 这是 Vite 的 兼容插件，用来让构建产物同时支持 旧版浏览器（不支持 ES Modules 的浏览器）。
import legacy from '@vitejs/plugin-legacy'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
// 这是 Vite 的 GLSL 着色器导入插件，让你在 JS/JSX 里能像导入普通模块一样 import 着色器文件。
import glsl from 'vite-plugin-glsl'


import _config from './_config'

const HOST = _config.server.host
const PORT = _config.server.port

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: HOST,
    port: PORT,
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        biomeDebug: path.resolve(__dirname, 'biome-debug.html'),
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@ui': path.resolve(__dirname, 'src/vue'),
      '@ui-components': path.resolve(__dirname, 'src/vue/components'),
      '@pinia': path.resolve(__dirname, 'src/pinia'),
      '@styles': path.resolve(__dirname, 'src/styles'),
      '@three': path.resolve(__dirname, 'src/js'),
    },
  },
  plugins: [    legacy(),glsl(),vue(),  partytownVite({
    dest: path.join(__dirname, 'dist', '~partytown'),
  }),],
})
